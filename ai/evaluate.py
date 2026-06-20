import torch
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
from model import build_model, get_device
from sklearn.metrics import confusion_matrix, classification_report
import json

TEST_DIR = 'data/pneumonia/chest_xray/chest_xray/test'
SAVE_PATH = 'data/model.pt'
CLASSES = ['NORMAL', 'PNEUMONIA']


def get_transform():
    return transforms.Compose([
        transforms.Grayscale(num_output_channels=3),
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406],
                             [0.229, 0.224, 0.225])
    ])


def evaluate():
    device = get_device()
    model = build_model(pretrained=False, freeze_backbone=False)
    model.load_state_dict(torch.load(SAVE_PATH, map_location=device))
    model.to(device)
    model.eval()

    transform = get_transform()
    test_dataset = datasets.ImageFolder(TEST_DIR, transform=transform)
    test_loader = DataLoader(test_dataset, batch_size=32, shuffle=False, num_workers=0)

    all_preds = []
    all_labels = []
    all_confidences = []

    with torch.inference_mode():
        for images, labels in test_loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            probs = torch.softmax(outputs, dim=1)
            confidence, predicted = probs.max(1)
            all_preds.extend(predicted.cpu().tolist())
            all_labels.extend(labels.cpu().tolist())
            all_confidences.extend(confidence.cpu().tolist())

    cm = confusion_matrix(all_labels, all_preds)
    report = classification_report(all_labels, all_preds, target_names=CLASSES)

    accuracy = sum(p == l for p, l in zip(all_preds, all_labels)) / len(all_labels)
    avg_confidence = sum(all_confidences) / len(all_confidences)

    print("=" * 50)
    print("VITALVISION MODEL EVALUATION")
    print("=" * 50)
    print(f"\nTest Accuracy:      {accuracy*100:.2f}%")
    print(f"Average Confidence: {avg_confidence*100:.2f}%")
    print(f"\nConfusion Matrix:")
    print(f"                 Predicted")
    print(f"                 NORMAL  PNEUMONIA")
    print(f"Actual NORMAL    {cm[0][0]:>6}  {cm[0][1]:>9}")
    print(f"Actual PNEUMONIA {cm[1][0]:>6}  {cm[1][1]:>9}")
    print(f"\nClassification Report:")
    print(report)

    results = {
        'accuracy': round(accuracy * 100, 2),
        'avg_confidence': round(avg_confidence * 100, 2),
        'confusion_matrix': cm.tolist(),
        'total_images': len(all_labels),
        'correct': sum(p == l for p, l in zip(all_preds, all_labels))
    }

    with open('data/eval_results.json', 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\nResults saved to data/eval_results.json")


if __name__ == "__main__":
    evaluate()