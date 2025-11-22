import pandas as pd
from scipy.sparse import csr_matrix
import pickle

# Load CSV (no header in your file)
df = pd.read_csv("meaningful-purchases.csv", header=None)
df.columns = ['user_id', 'item_id', 'rating']

# Aggregate duplicate user-item pairs (take mean)
df_agg = df.groupby(['user_id', 'item_id'], as_index=False)['rating'].mean()

# Pivot to user-item matrix
user_item_matrix = df_agg.pivot(index='user_id', columns='item_id', values='rating')

# Fill missing ratings with 0
user_item_matrix = user_item_matrix.fillna(0)

# Save the user-item matrix as pickle
with open('user_item_matrix.pkl', 'wb') as f:
    pickle.dump(user_item_matrix, f)

print("✅ user_item_matrix.pkl saved successfully!")
print(f"Shape: {user_item_matrix.shape}")
print(f"Users: {len(user_item_matrix.index)}")
print(f"Items: {len(user_item_matrix.columns)}")

# Verify user 5 exists and has ratings
if 5 in user_item_matrix.index:
    user_5_ratings = user_item_matrix.loc[5]
    rated_items = user_5_ratings[user_5_ratings > 0]
    print(f"\n✅ User 5 found! They rated {len(rated_items)} items:")
    print(rated_items.head())
else:
    print("\n❌ User 5 not found in matrix!")
