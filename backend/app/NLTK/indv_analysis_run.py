import sentiment_individual_analysis as indv
import glob
from pathlib import Path

results = []
for path in glob.glob("transcripts/candidate_*.txt"):
    text = indv.clean_transcript(Path(path).read_text())
    print(text + '\n')

    res = indv.measure_constructs_from_text(text)
    results.append({
        "candidate": Path(path).stem,
        **res["scores"]
    })

import pandas as pd
df = pd.DataFrame(results)
#df.to_csv("candidates.csv", index=False)
print(df)
