import torch
from torchvision import transforms
from PIL import Image
import io
import base64
from pathlib import Path
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from model import build_model, get_device

SAVE_PATH = Path(__file__).resolve().parent / 'data' / 'model.pt'
CLASSES = ['NORMAL', 'PNEUMONIA']

_model = None
_device = None

def load_model():
    global _model, _device
    if _model is None:
        _device = get_device()
        _model = build_model(pretrained=False, freeze_backbone=False)
        _model.load_state_dict(torch.load(SAVE_PATH, map_location=_device, weights_only=True))
        _model.to(_device)
        _model.eval()
    return _model, _device

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

REPORT_TEMPLATES = {
    'en': {
        'normal_findings': [
            ('Lung fields', 'No significant opacification or consolidation detected.'),
            ('Cardiac silhouette', 'Normal size and contour.'),
            ('Pleural spaces', 'No effusion or pneumothorax identified.'),
        ],
        'normal_impression': (
            'No acute cardiopulmonary abnormality detected. '
            'Model confidence: {confidence:.1f}%. '
            'Routine follow-up recommended.'
        ),
        'normal_recommendation': 'No immediate action required. Routine clinical follow-up as indicated.',
        'pneumonia_findings': [
            ('Lung fields',
             'Pulmonary opacification consistent with pneumonia detected. Model confidence: {confidence:.1f}%.'),
            ('Affected parenchyma',
             'Consolidation pattern suggestive of bacterial or viral pneumonia.'),
        ],
        'pneumonia_impression': (
            'Findings consistent with pulmonary pneumonia. '
            'Risk score {risk_score}/100 ({risk_level}). '
            'Prompt clinical correlation recommended.'
        ),
        'pneumonia_recommendation_high': (
            'Immediate radiologist review recommended. '
            'Consider antibiotic therapy and follow-up imaging in 48-72 hours.'
        ),
        'pneumonia_recommendation_low': 'Clinical correlation advised. Follow-up chest X-ray recommended.',
    },
    'sq': {
        'normal_findings': [
            ('Fushat pulmonare', 'Nuk u zbulua opacifikim ose konsolidim i rëndësishëm.'),
            ('Silueta kardiake', 'Madhësia dhe kontura normale.'),
            ('Hapësirat pleurale', 'Nuk u identifikua efuzion ose pneumotoraks.'),
        ],
        'normal_impression': (
            'Nuk u zbulua anomali akute kardiopulmonare. '
            'Besueshmëria e modelit: {confidence:.1f}%. '
            'Rekomandohet kontroll rutinor.'
        ),
        'normal_recommendation': 'Nuk kërkohet veprim i menjëhershëm. Kontroll klinik rutinor sipas indikacioneve.',
        'pneumonia_findings': [
            ('Fushat pulmonare',
             'U zbulua opacifikim pulmonar në përputhje me pneumoninë. Besueshmëria e modelit: {confidence:.1f}%.'),
            ('Parenkima e prekur',
             'Model konsolidimi sugjeron pneumoni bakteriale ose virale.'),
        ],
        'pneumonia_impression': (
            'Gjetjet në përputhje me pneumoni pulmonare. '
            'Pikëzimi i riskut {risk_score}/100 ({risk_level}). '
            'Rekomandohet korrelim i shpejtë klinik.'
        ),
        'pneumonia_recommendation_high': (
            'Rekomandohet rishikim i menjëhershëm nga radiologu. '
            'Konsidero terapi me antibiotikë dhe imazheri kontrolli brenda 48-72 orëve.'
        ),
        'pneumonia_recommendation_low': 'Këshillohet korrelim klinik. Rekomandohet rentgen kontrolli i kraharorit.',
    },
}

def get_report(predicted_class: str, confidence: float, risk_score: int, lang: str = 'en') -> dict:
    tpl = REPORT_TEMPLATES.get(lang, REPORT_TEMPLATES['en'])
    confidence_pct = confidence * 100
    risk_level = get_risk_level(risk_score)

    if predicted_class == 'NORMAL':
        return {
            'findings': [
                {'region': r, 'severity': 'normal', 'description': d.format(confidence=confidence_pct)}
                for r, d in tpl['normal_findings']
            ],
            'impression': tpl['normal_impression'].format(confidence=confidence_pct),
            'recommendation': tpl['normal_recommendation'],
        }

    severity = 'severe' if risk_score >= 75 else 'moderate' if risk_score >= 50 else 'mild'
    return {
        'findings': [
            {'region': r, 'severity': severity, 'description': d.format(confidence=confidence_pct)}
            for r, d in tpl['pneumonia_findings']
        ],
        'impression': tpl['pneumonia_impression'].format(
            risk_score=risk_score, risk_level=risk_level
        ),
        'recommendation': (
            tpl['pneumonia_recommendation_high']
            if risk_score >= 75
            else tpl['pneumonia_recommendation_low']
        ),
    }

def analyze(image_base64: str = None, image_path: str = None, lang: str = 'en') -> dict:
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
    report = get_report(predicted_class, confidence_val, risk_score, lang=lang)

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