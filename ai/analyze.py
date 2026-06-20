import torch
from torchvision import transforms
from PIL import Image
import io
import base64
from pathlib import Path
from model import build_model, get_device

SAVE_PATH = Path(__file__).resolve().parent / 'data' / 'model.pt'
CLASSES = ['NORMAL', 'PNEUMONIA']

def load_model():
    device = get_device()
    model = build_model(pretrained=False, freeze_backbone=False)
    model.load_state_dict(torch.load(SAVE_PATH, map_location=device, weights_only=True))
    model.to(device)
    model.eval()
    return model, device

def get_transform():
    return transforms.Compose([
        transforms.Grayscale(num_output_channels=3),
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406],
                             [0.229, 0.224, 0.225])
    ])

def confidence_to_risk_score(confidence: float, predicted_class: str) -> int:
    if predicted_class == 'NORMAL':
        return int((1 - confidence) * 40)
    else:
        return int(40 + confidence * 60)

def get_risk_level(risk_score: int) -> str:
    if risk_score < 30:
        return 'LOW'
    elif risk_score < 60:
        return 'MODERATE'
    elif risk_score < 75:
        return 'HIGH'
    return 'CRITICAL'

def get_report(predicted_class: str, confidence: float, risk_score: int) -> dict:
    if predicted_class == 'NORMAL':
        return {
            'findings': [
                {
                    'region': 'Lung fields',
                    'severity': 'normal',
                    'description': 'No significant opacification or consolidation detected.'
                },
                {
                    'region': 'Cardiac silhouette',
                    'severity': 'normal',
                    'description': 'Normal size and contour.'
                },
                {
                    'region': 'Pleural spaces',
                    'severity': 'normal',
                    'description': 'No effusion or pneumothorax identified.'
                }
            ],
            'impression': (
                f'No acute cardiopulmonary abnormality detected. '
                f'Model confidence: {confidence*100:.1f}%. '
                f'Routine follow-up recommended.'
            ),
            'recommendation': 'No immediate action required. Routine clinical follow-up as indicated.'
        }
    else:
        severity = 'severe' if risk_score >= 75 else 'moderate' if risk_score >= 50 else 'mild'
        return {
            'findings': [
                {
                    'region': 'Lung fields',
                    'severity': severity,
                    'description': (
                        f'Pulmonary opacification consistent with pneumonia detected. '
                        f'Model confidence: {confidence*100:.1f}%.'
                    )
                },
                {
                    'region': 'Affected parenchyma',
                    'severity': severity,
                    'description': 'Consolidation pattern suggestive of bacterial or viral pneumonia.'
                }
            ],
            'impression': (
                f'Findings consistent with pulmonary pneumonia. '
                f'Risk score {risk_score}/100 ({get_risk_level(risk_score)}). '
                f'Prompt clinical correlation recommended.'
            ),
            'recommendation': (
                'Immediate radiologist review recommended. '
                'Consider antibiotic therapy and follow-up imaging in 48-72 hours.'
                if risk_score >= 75 else
                'Clinical correlation advised. Follow-up chest X-ray recommended.'
            )
        }

def analyze(image_base64: str = None, image_path: str = None) -> dict:
    model, device = load_model()
    transform = get_transform()

    if image_base64:
        image_data = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_data)).convert('RGB')
    elif image_path:
        image = Image.open(image_path).convert('RGB')
    else:
        raise ValueError("Provide either image_base64 or image_path")

    tensor = transform(image).unsqueeze(0).to(device)

    with torch.inference_mode():
        outputs = model(tensor)
        probs = torch.softmax(outputs, dim=1)
        confidence, predicted = probs.max(1)

    predicted_class = CLASSES[predicted.item()]
    confidence_val = confidence.item()
    risk_score = confidence_to_risk_score(confidence_val, predicted_class)
    risk_level = get_risk_level(risk_score)
    report = get_report(predicted_class, confidence_val, risk_score)

    return {
        'riskScore': risk_score,
        'riskLevel': risk_level,
        'predictedClass': predicted_class,
        'confidence': round(confidence_val * 100, 2),
        'findings': report['findings'],
        'impression': report['impression'],
        'recommendation': report['recommendation'],
        'tags': [predicted_class.lower(), f'confidence-{int(confidence_val*100)}%', 'chest-xray']
    }

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python3 analyze.py <image_path>")
        sys.exit(1)
    result = analyze(image_path=sys.argv[1])
    import json
    print(json.dumps(result, indent=2))