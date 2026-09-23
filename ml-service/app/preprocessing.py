import re


CONTRACTIONS = {
    r"\bi'm\b": "i am",
    r"\bim\b": "i am",
    r"\bdon't\b": "do not",
    r"\bdont\b": "do not",
    r"\bcan't\b": "cannot",
    r"\bcant\b": "cannot",
    r"\bwon't\b": "will not",
    r"\bwont\b": "will not",
    r"\bit's\b": "it is",
    r"\bi've\b": "i have",
    r"\bive\b": "i have",
    r"\bi'll\b": "i will",
    r"\bi'd\b": "i would",
    r"\byou're\b": "you are",
    r"\byoure\b": "you are",
    r"\bwe're\b": "we are",
    r"\bthey're\b": "they are",
    r"\bthat's\b": "that is",
    r"\bwhat's\b": "what is",
    r"\bisn't\b": "is not",
    r"\baren't\b": "are not",
    r"\bwasn't\b": "was not",
    r"\bweren't\b": "were not",
    r"\bhaven't\b": "have not",
    r"\bhasn't\b": "has not",
    r"\bhadn't\b": "had not",
    r"\bdoesn't\b": "does not",
    r"\bdosent\b": "does not",
    r"\bdidn't\b": "did not",
    r"\bcouldn't\b": "could not",
    r"\bshouldn't\b": "should not",
    r"\bwouldn't\b": "would not",
}


def expand_contractions(text: str) -> str:
    for pattern, repl in CONTRACTIONS.items():
        text = re.sub(pattern, repl, text, flags=re.IGNORECASE)
    return text


def clean_text(text: str) -> str:
    """Standardizes input text matching the training pipeline preprocessing."""
    text = str(text).lower()
    text = re.sub(r"http\S+|www\S+", " ", text)
    text = expand_contractions(text)
    text = re.sub(r"[^a-z0-9\s!?.,]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def is_uninformative_text(text: str) -> bool:
    """Detects obvious gibberish, repeated characters, or uninformative noise.

    Returns True if the text lacks sufficient linguistic structure to support
    a meaningful classification.
    """
    cleaned = clean_text(text)
    if not cleaned or len(cleaned) < 2:
        return True

    # Strip punctuation and spaces to inspect character diversity
    alpha_chars = re.sub(r"[^a-z]", "", cleaned)
    if not alpha_chars:
        # Input consists only of numbers/punctuation
        return True

    # Check for single-character spam (e.g., 'ssssss', 'aaaaaa')
    unique_chars = set(alpha_chars)
    if len(unique_chars) == 1 and len(alpha_chars) >= 3:
        return True

    # Check if the ratio of unique characters to length is suspiciously degenerate
    # e.g., 'abababababab' or 'asdasdasd'
    if len(alpha_chars) >= 6 and len(unique_chars) <= 2:
        return True

    return False

