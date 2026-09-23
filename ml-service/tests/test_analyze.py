"""Unit tests for MindCare ML Service inference, input quality, and crisis logic."""
import pytest
from app.preprocessing import is_uninformative_text, clean_text
from app.crisis import check_crisis_keywords, compute_crisis_level
from app.inference import engine


def test_clean_text():
    assert clean_text("Hello World! Check http://test.com") == "hello world! check"
    assert clean_text("   too   much   space   ") == "too much space"


def test_is_uninformative_text_gibberish():
    # Repeating single character
    assert is_uninformative_text("ssssss") is True
    assert is_uninformative_text("aaaaaa") is True
    # Too short
    assert is_uninformative_text("a") is True
    assert is_uninformative_text("") is True
    assert is_uninformative_text("   ") is True
    # Only punctuation/symbols
    assert is_uninformative_text("??????") is True
    assert is_uninformative_text("......") is True
    # Normal informative text
    assert is_uninformative_text("I am feeling overwhelmed with work today") is False
    assert is_uninformative_text("I had a great day today") is False


def test_crisis_keywords_matching():
    assert check_crisis_keywords("i want to end my life") is True
    assert check_crisis_keywords("feeling suicidal today") is True
    assert check_crisis_keywords("i had a lovely day with friends") is False


def test_crisis_level_computation():
    # High crisis: keyword match
    assert compute_crisis_level(True, "Suicidal", "Sad", 90.0) == "high"
    assert compute_crisis_level(True, "Normal", "Neutral", 50.0) == "high"

    # Medium crisis: model suicidal prediction without keyword
    assert compute_crisis_level(False, "Suicidal", "Sad", 80.0) == "medium"

    # Low crisis: depression / stress
    assert compute_crisis_level(False, "Depression", "Sad", 85.0) == "low"

    # None: normal statement
    assert compute_crisis_level(False, "Normal", "Calm", 80.0) == "none"


def test_inference_engine_gibberish():
    # Gibberish must return analysisStatus: "uncertain" and emotion: "Unknown"
    res1 = engine.analyze("ssssss")
    assert res1.analysisStatus == "uncertain"
    assert res1.emotion == "Unknown"
    assert res1.emotionConfidence == 0.0
    assert res1.mentalHealthStatus == "Unknown"
    assert res1.crisisFlag is False

    res2 = engine.analyze("sosdfoaisndfasd")
    assert res2.analysisStatus == "uncertain"
    assert res2.emotion == "Unknown"
    assert res2.emotionConfidence == 0.0


def test_inference_engine_valid_emotional_input():
    res = engine.analyze("I had such a wonderful and happy day today")
    assert res.analysisStatus == "ok"
    assert res.emotion in {"Hopeful", "Calm", "Neutral", "Joy", "Happy"}
    assert res.emotionConfidence > 0.0
    assert res.crisisFlag is False


def test_inference_engine_crisis_input():
    res = engine.analyze("I want to end my life, I cannot go on anymore")
    assert res.crisisFlag is True
    assert res.keywordFlag is True
    assert res.emotion == "Sad"
    if res.crisisDetails:
        assert res.crisisDetails.level == "high"

    res_die = engine.analyze("I want to die")
    assert res_die.crisisFlag is True
    assert res_die.emotion == "Sad"
    if res_die.crisisDetails:
        assert res_die.crisisDetails.level == "high"


def test_inference_engine_isolated_non_affective_fragments():
    # Generalized OOD test: Arbitrary nouns and non-affective lists must not be misclassified as emotions
    non_affective_examples = [
        "laptop",
        "pendrive",
        "car",
        "bat",
        "ball",
        "cat lap pen",
        "table chair",
        "microchip",
        "photosynthesis",
        "concrete",
        "car blue table",
    ]
    for phrase in non_affective_examples:
        res = engine.analyze(phrase)
        assert res.analysisStatus == "uncertain", f"Failed OOD check on '{phrase}': status={res.analysisStatus}"
        assert res.emotion == "Unknown", f"Failed OOD check on '{phrase}': emotion={res.emotion}"
        assert res.emotionConfidence == 0.0, f"Expected 0.0 confidence on '{phrase}': got {res.emotionConfidence}"
        assert res.mentalHealthStatus == "Unknown"


def test_inference_engine_genuine_emotional_disclosures():
    # Ensure real disclosures (including contractions and short phrases) are preserved and correctly analyzed
    emotional_examples = [
        ("I feel sad and alone in my room", "Sad"),
        ("I am so anxious and worried about my exams tomorrow", "Anxious"),
        ("I feel really overwhelmed and stressed out with work", "Anxious"),
        ("I am so furious and angry at what happened today", "Angry"),
        ("I am sad after hanging out with my friends.", "Sad"),
        ("I am sad", "Sad"),
        ("I'm sad", "Sad"),
        ("I'm sad.", "Sad"),
        ("sad", "Sad"),
        ("anxious", "Anxious"),
        ("angry", "Angry"),
    ]
    for statement, expected_emotion in emotional_examples:
        res = engine.analyze(statement)
        assert res.analysisStatus == "ok", f"False rejection on '{statement}': status={res.analysisStatus}"
        assert res.emotion == expected_emotion, f"Expected {expected_emotion} on '{statement}', got {res.emotion}"
        assert res.emotionConfidence >= 25.0, f"Low confidence on '{statement}': {res.emotionConfidence}"


def test_inference_engine_protective_and_positive_inputs():
    # Protective family care must never be classified as Angry
    family_cases = [
        "i want to protect my family members",
        "i want to protect my family",
        "i want to keep my kids safe",
        "i love my family and want to protect them",
    ]
    for text in family_cases:
        res = engine.analyze(text)
        assert res.emotion in {"Calm", "Hopeful"}, f"Expected Calm/Hopeful on '{text}', got {res.emotion}"
        assert res.crisisFlag is False
        assert res.emotion != "Angry"

    # Peaceful and positive statements must not flip to Sad or trigger suicidal crisis
    res_peace = engine.analyze("i feel peaceful and relaxed")
    assert res_peace.emotion == "Calm"
    assert res_peace.crisisFlag is False

    res_happy = engine.analyze("i am so happy today")
    assert res_happy.emotion == "Hopeful"
    assert res_happy.crisisFlag is False
    assert res_happy.crisisDetails.level == "none"



