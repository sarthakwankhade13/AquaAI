import json, os, sys
from pathlib import Path

models_dir = Path('backend/src/ml/models')
files = list(models_dir.iterdir())
print('Models directory contents:')
for f in files:
    print(' ', f.name, f.stat().st_size, 'bytes')

meta_path = models_dir / 'model_metadata.json'
if meta_path.exists():
    with open(meta_path, encoding='utf-8') as f:
        meta = json.load(f)
    print()
    print('Test metrics:')
    for model, m in meta.get('test_metrics', {}).items():
        recall = m.get('recall_drought', 0)
        f1 = m.get('f1_drought', 0)
        roc = m.get('roc_auc', 0)
        print(f'  {model}: recall={recall:.3f} f1={f1:.3f} roc_auc={roc:.3f}')
    print()
    print('Ensemble weights:', meta.get('ensemble_weights'))
    features = meta.get('features', [])
    print('Features (' + str(len(features)) + '):', features[:5], '...')
else:
    print('model_metadata.json not found!')
