import pytest

from app.history import store


@pytest.fixture(autouse=True)
def temporary_database(tmp_path, monkeypatch):
    monkeypatch.setattr(store, "DATABASE", tmp_path / "test.sqlite3")
    store.initialize()
