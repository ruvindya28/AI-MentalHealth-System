import numpy as np
from pathlib import Path
from typing import Optional
from .config import AFFECTIVE_CENTROID_PATH


class AffectiveOODDetector:
    """Statistical Out-Of-Domain (OOD) detector using the affective corpus centroid.
    
    Measures the cosine similarity of the input TF-IDF vector against the normalized
    mean centroid of genuine emotional/mental-health expressions.
    """

    def __init__(self, centroid_path: Optional[Path] = None):
        self.centroid_path = centroid_path or AFFECTIVE_CENTROID_PATH
        self.centroid: Optional[np.ndarray] = None
        self._load_centroid()

    def _load_centroid(self):
        try:
            if self.centroid_path.exists():
                self.centroid = np.load(self.centroid_path)
            else:
                self.centroid = None
        except Exception as e:
            print(f'[WARN] Could not load affective centroid: {e}')
            self.centroid = None

    def compute_relevance(self, emo_vec) -> float:
        """Computes cosine similarity between sparse TF-IDF input and the affective centroid."""
        if self.centroid is None or emo_vec.nnz == 0:
            return 0.0

        # Since vectorizer produces L2-normalized sparse rows,
        # cosine similarity with the L2-normalized centroid is simply the inner product.
        vec_dense = emo_vec.toarray().flatten()
        norm = np.linalg.norm(vec_dense)
        if norm == 0:
            return 0.0
        return float(np.dot(vec_dense, self.centroid) / norm)


ood_detector = AffectiveOODDetector()
