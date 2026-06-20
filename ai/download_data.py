import pandas as pd

df = pd.read_csv('data/Data_Entry_2017.csv')

df['binary_label'] = df['Finding Labels'].apply(
    lambda x: 'normal' if x == 'No Finding' else 'anomaly'
)

anomaly = df[
    (df['binary_label'] == 'anomaly') &
    (~df['Finding Labels'].str.contains(r'\|'))
].sample(3000, random_state=42)

normal = df[df['binary_label'] == 'normal'].sample(3000, random_state=42)

selected = pd.concat([normal, anomaly])
selected.to_csv('data/selected_images.csv', index=False)

print(f"Normal: {len(normal)}")
print(f"Anomaly: {len(anomaly)}")
print(f"Total: {len(selected)}")
print("\nAnomaly class distribution:")
print(anomaly['Finding Labels'].value_counts())