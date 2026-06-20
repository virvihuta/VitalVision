import torch
import torch.nn as nn
from torchvision import models

def build_model(num_classes=2, pretrained=True):
    model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT if pretrained else None)
    in_features = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Dropout(0.3),
        nn.Linear(in_features, num_classes)
    )
    return model

def get_device():
    if torch.backends.mps.is_available():
        return torch.device("mps")
    elif torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")

if __name__ == "__main__":
    device = get_device()
    print(f"Using device: {device}")
    model = build_model()
    model.to(device)
    print("Model ready")
    print(f"Parameters: {sum(p.numel() for p in model.parameters()):,}")