import torch
import torch.nn as nn
from torch.utils.data import DataLoader, WeightedRandomSampler
from torchvision import datasets, transforms
from model import build_model, get_device

TRAIN_DIR = 'data/pneumonia/chest_xray/chest_xray/train'
VAL_DIR = 'data/pneumonia/chest_xray/chest_xray/val'
TEST_DIR = 'data/pneumonia/chest_xray/chest_xray/test'
BATCH_SIZE = 32
EPOCHS = 20
LR = 3e-4
WEIGHT_DECAY = 1e-4
SAVE_PATH = 'data/model.pt'


def get_transforms():
    train_transform = transforms.Compose([
        transforms.Grayscale(num_output_channels=3),
        transforms.Resize((256, 256)),
        transforms.RandomCrop(224),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.3, contrast=0.3),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406],
                             [0.229, 0.224, 0.225]),
        transforms.RandomErasing(p=0.2)
    ])
    val_transform = transforms.Compose([
        transforms.Grayscale(num_output_channels=3),
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406],
                             [0.229, 0.224, 0.225])
    ])
    return train_transform, val_transform


def get_sampler(dataset):
    labels = [s[1] for s in dataset.samples]
    class_counts = torch.bincount(torch.tensor(labels))
    weights = 1.0 / class_counts.float()
    sample_weights = weights[torch.tensor(labels)]
    return WeightedRandomSampler(sample_weights, len(sample_weights))


def evaluate(model, loader, criterion, device, split_name):
    model.eval()
    total_loss = 0.0
    correct = 0
    total = 0

    with torch.inference_mode():
        for images, labels in loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)
            total_loss += loss.item()
            correct += (outputs.argmax(1) == labels).sum().item()
            total += labels.size(0)

    acc = correct / total
    print(f"{split_name} | Loss: {total_loss/len(loader):.4f} | Acc: {acc:.4f}")
    return acc


def train():
    device = get_device()
    print(f"Device: {device}")

    train_transform, val_transform = get_transforms()

    train_dataset = datasets.ImageFolder(TRAIN_DIR, transform=train_transform)
    val_dataset = datasets.ImageFolder(VAL_DIR, transform=val_transform)
    test_dataset = datasets.ImageFolder(TEST_DIR, transform=val_transform)

    print(f"Classes: {train_dataset.classes}")
    print(f"Train: {len(train_dataset)} | Val: {len(val_dataset)} | Test: {len(test_dataset)}")

    sampler = get_sampler(train_dataset)
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, sampler=sampler, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)
    test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

    model = build_model(freeze_backbone=True).to(device)

    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    optimizer = torch.optim.Adam(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=LR,
        weight_decay=WEIGHT_DECAY
    )
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS)

    best_val_acc = 0.0
    patience = 5
    patience_counter = 0

    for epoch in range(EPOCHS):

        if epoch == 5:
            print("\nUnfreezing full network...\n")
            for param in model.parameters():
                param.requires_grad = True
            optimizer = torch.optim.Adam(
                model.parameters(),
                lr=LR / 10,
                weight_decay=WEIGHT_DECAY
            )
            scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
                optimizer,
                T_max=EPOCHS - 5
            )

        model.train()
        train_loss = 0.0
        train_correct = 0

        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()
            train_loss += loss.item()
            train_correct += (outputs.argmax(1) == labels).sum().item()

        train_acc = train_correct / len(train_dataset)
        val_acc = evaluate(model, val_loader, criterion, device, "Val")

        print(f"Epoch {epoch+1}/{EPOCHS} | "
              f"Train Loss: {train_loss/len(train_loader):.4f} | "
              f"Train Acc: {train_acc:.4f} | "
              f"Val Acc: {val_acc:.4f}")

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            patience_counter = 0
            torch.save(model.state_dict(), SAVE_PATH)
            print(f"  ✓ Saved best model (val acc: {val_acc:.4f})")
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print(f"\nEarly stopping at epoch {epoch+1}")
                break

        scheduler.step()

    print(f"\nTraining complete. Best val accuracy: {best_val_acc:.4f}")
    print("\nLoading best model for test evaluation...")
    model.load_state_dict(torch.load(SAVE_PATH, map_location=device))
    evaluate(model, test_loader, criterion, device, "Test")


if __name__ == "__main__":
    train()