"""
Embedding Service
-----------------
Uses sentence-transformers (all-MiniLM-L6-v2) to create embeddings locally.
Stores them in a FAISS index — no external LLM API required for core search.
"""
import os
import json
import numpy as np
import faiss
from typing import List, Tuple
from sentence_transformers import SentenceTransformer
from app.core.config import settings

MODEL_NAME = "all-MiniLM-L6-v2"

class EmbeddingService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def _init(self):
        if self._initialized:
            return
        self.model = SentenceTransformer(MODEL_NAME)
        self.dimension = 384          # all-MiniLM-L6-v2 output dim
        self.index_path = settings.FAISS_INDEX_PATH
        self.meta_path = f"{self.index_path}.meta.json"
        os.makedirs(self.index_path, exist_ok=True)
        self._load_or_create_index()
        self._initialized = True

    # ── index lifecycle ──────────────────────────────────────────────────────

    def _load_or_create_index(self):
        idx_file = os.path.join(self.index_path, "index.faiss")
        if os.path.exists(idx_file):
            self.index = faiss.read_index(idx_file)
            with open(self.meta_path, "r") as f:
                self.metadata: List[dict] = json.load(f)
        else:
            self.index = faiss.IndexFlatIP(self.dimension)   # inner-product (cosine after normalise)
            self.metadata: List[dict] = []

    def _save_index(self):
        idx_file = os.path.join(self.index_path, "index.faiss")
        faiss.write_index(self.index, idx_file)
        with open(self.meta_path, "w") as f:
            json.dump(self.metadata, f)

    # ── public API ───────────────────────────────────────────────────────────

    def embed(self, text: str) -> np.ndarray:
        self._init()
        vec = self.model.encode([text], normalize_embeddings=True)
        return vec.astype("float32")

    def add_document(self, doc_id: int, title: str, content: str):
        """Chunk the document and add every chunk to the FAISS index."""
        self._init()
        chunks = self._chunk_text(content)
        for i, chunk in enumerate(chunks):
            vec = self.embed(chunk)
            self.index.add(vec)
            self.metadata.append({
                "doc_id": doc_id,
                "title": title,
                "chunk": chunk,
                "chunk_idx": i,
            })
        self._save_index()

    def search(self, query: str, top_k: int = 5) -> List[Tuple[dict, float]]:
        """Return (metadata, score) pairs for the top_k closest chunks."""
        self._init()
        if self.index.ntotal == 0:
            return []
        q_vec = self.embed(query)
        k = min(top_k, self.index.ntotal)
        scores, indices = self.index.search(q_vec, k)
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1:
                continue
            results.append((self.metadata[idx], float(score)))
        return results

    def remove_document(self, doc_id: int):
        """Rebuild index without the given doc_id (FAISS FlatIndex has no delete)."""
        self._init()
        kept_meta = [m for m in self.metadata if m["doc_id"] != doc_id]
        self.index = faiss.IndexFlatIP(self.dimension)
        self.metadata = []
        for meta in kept_meta:
            vec = self.embed(meta["chunk"])
            self.index.add(vec)
            self.metadata.append(meta)
        self._save_index()

    # ── helpers ──────────────────────────────────────────────────────────────

    @staticmethod
    def _chunk_text(text: str, chunk_size: int = 300, overlap: int = 50) -> List[str]:
        words = text.split()
        chunks, start = [], 0
        while start < len(words):
            chunk = " ".join(words[start: start + chunk_size])
            chunks.append(chunk)
            start += chunk_size - overlap
        return chunks or [text]


# Singleton
embedding_service = EmbeddingService()
