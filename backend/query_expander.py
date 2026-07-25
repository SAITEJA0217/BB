import json
import os

SYNONYMS_FILE = os.path.join(os.path.dirname(__file__), "synonyms.json")

def load_synonyms():
    if not os.path.exists(SYNONYMS_FILE):
        return {}
    with open(SYNONYMS_FILE, 'r') as f:
        return json.load(f)

def expand_query(query: str) -> str:
    synonyms_dict = load_synonyms()
    expanded_terms = set(query.split())
    
    # Simple unigram and phrase expansion
    query_lower = query.lower()
    
    for key, syn_list in synonyms_dict.items():
        # If the key is in the query, add its synonyms
        if key in query_lower:
            for syn in syn_list:
                expanded_terms.update(syn.split())
        
        # If any synonym is in the query, add the key
        for syn in syn_list:
            if syn in query_lower:
                expanded_terms.add(key)
                
    return " ".join(expanded_terms)
