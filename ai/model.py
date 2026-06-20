import torch
import torch.nn as nn
from torchvision import models

def build_model(pretrained=True):
    weights = models.EfficientNet_B0_Weights.DEFAULT if pretrained else None
    model = models.efficientnet_b0(weights=weights)
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(0.3),
        nn.Linear(in_features, 2)
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