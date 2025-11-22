#!/usr/bin/env python3
# test_recommendations.py
# Test the recommendation model directly

import sys
import pickle
import numpy as np
from pathlib import Path

def test_model():
    """Test if the recommendation model works correctly"""
    model_dir = Path(__file__).parent
    
    print("=" * 60)
    print("TESTING RECOMMENDATION MODEL")
    print("=" * 60)
    
    # Load all pickle files
    print("\n1. Loading pickle files...")
    try:
        with open(model_dir / 'svd_model.pkl', 'rb') as f:
            svd_model = pickle.load(f)
        print("   ✅ svd_model.pkl loaded")
        
        with open(model_dir / 'user_item_index.pkl', 'rb') as f:
            user_index = pickle.load(f)
        print(f"   ✅ user_item_index.pkl loaded ({len(user_index)} users)")
        
        with open(model_dir / 'user_item_columns.pkl', 'rb') as f:
            item_columns = pickle.load(f)
        print(f"   ✅ user_item_columns.pkl loaded ({len(item_columns)} items)")
        
        with open(model_dir / 'user_item_matrix.pkl', 'rb') as f:
            user_item_matrix = pickle.load(f)
        print(f"   ✅ user_item_matrix.pkl loaded (shape: {user_item_matrix.shape})")
        
    except Exception as e:
        print(f"   ❌ Error loading files: {e}")
        return
    
    # Test with user 5 (should be in training data)
    print("\n2. Testing with User 5 (existing user)...")
    user_id = 5
    
    if user_id not in user_index:
        print(f"   ❌ User {user_id} not found in user_index!")
        return
    
    print(f"   ✅ User {user_id} found in training data")
    
    # Get user's actual ratings
    user_row = user_item_matrix.loc[user_id]
    rated_items = user_row[user_row > 0]
    print(f"   User {user_id} rated {len(rated_items)} items:")
    print(f"   {rated_items.head(10).to_dict()}")
    
    # Transform to latent space
    print("\n3. Computing predictions...")
    user_row_reshaped = user_row.values.reshape(1, -1)
    user_factors = svd_model.transform(user_row_reshaped)
    print(f"   User factors shape: {user_factors.shape}")
    
    # Compute predicted ratings
    predicted_ratings = np.dot(user_factors, svd_model.components_)[0]
    print(f"   Predicted ratings shape: {predicted_ratings.shape}")
    print(f"   Min predicted rating: {predicted_ratings.min():.4f}")
    print(f"   Max predicted rating: {predicted_ratings.max():.4f}")
    print(f"   Mean predicted rating: {predicted_ratings.mean():.4f}")
    
    # Get recommendations (excluding already rated items)
    print("\n4. Filtering recommendations...")
    rated_item_ids = rated_items.index.tolist()
    
    recommendations = []
    for i, product_id in enumerate(item_columns):
        if product_id not in rated_item_ids:
            recommendations.append({
                'product_id': int(product_id),
                'predicted_rating': float(predicted_ratings[i])
            })
    
    print(f"   Total unrated items: {len(recommendations)}")
    
    # Filter by min_rating >= 4.0
    filtered_recs = [r for r in recommendations if r['predicted_rating'] >= 4.0]
    print(f"   Items with predicted rating >= 4.0: {len(filtered_recs)}")
    
    # Sort and get top 10
    filtered_recs.sort(key=lambda x: x['predicted_rating'], reverse=True)
    top_10 = filtered_recs[:10]
    
    print(f"\n5. TOP 10 RECOMMENDATIONS FOR USER {user_id}:")
    print("   " + "=" * 55)
    if len(top_10) > 0:
        for idx, rec in enumerate(top_10, 1):
            print(f"   {idx:2d}. Product ID: {rec['product_id']:3d} | Predicted Rating: {rec['predicted_rating']:.4f}")
    else:
        print("   ❌ No recommendations found with rating >= 4.0!")
        print("\n   Showing top 10 regardless of rating threshold:")
        all_sorted = sorted(recommendations, key=lambda x: x['predicted_rating'], reverse=True)[:10]
        for idx, rec in enumerate(all_sorted, 1):
            print(f"   {idx:2d}. Product ID: {rec['product_id']:3d} | Predicted Rating: {rec['predicted_rating']:.4f}")
    
    # Test with a new user (not in training data)
    print("\n" + "=" * 60)
    print("6. Testing with User 10 (new user - cold start)...")
    new_user_id = 10
    
    if new_user_id in user_index:
        print(f"   User {new_user_id} exists in training data (unexpected)")
    else:
        print(f"   ✅ User {new_user_id} not in training data (expected)")
    
    # Use mean of all users
    all_user_factors = svd_model.transform(user_item_matrix.values)
    avg_user_factors = np.mean(all_user_factors, axis=0).reshape(1, -1)
    print(f"   Average user factors shape: {avg_user_factors.shape}")
    
    # Compute predicted ratings
    predicted_ratings_new = np.dot(avg_user_factors, svd_model.components_)[0]
    print(f"   Min predicted rating: {predicted_ratings_new.min():.4f}")
    print(f"   Max predicted rating: {predicted_ratings_new.max():.4f}")
    print(f"   Mean predicted rating: {predicted_ratings_new.mean():.4f}")
    
    # Get top recommendations
    recs_new = [
        {'product_id': int(item_columns[i]), 'predicted_rating': float(predicted_ratings_new[i])}
        for i in range(len(item_columns))
    ]
    recs_new_filtered = [r for r in recs_new if r['predicted_rating'] >= 4.0]
    recs_new_filtered.sort(key=lambda x: x['predicted_rating'], reverse=True)
    top_10_new = recs_new_filtered[:10]
    
    print(f"\n7. TOP 10 RECOMMENDATIONS FOR USER {new_user_id} (Cold Start):")
    print("   " + "=" * 55)
    if len(top_10_new) > 0:
        for idx, rec in enumerate(top_10_new, 1):
            print(f"   {idx:2d}. Product ID: {rec['product_id']:3d} | Predicted Rating: {rec['predicted_rating']:.4f}")
    else:
        print("   ❌ No recommendations found with rating >= 4.0!")
        print("\n   Showing top 10 regardless of rating threshold:")
        all_sorted_new = sorted(recs_new, key=lambda x: x['predicted_rating'], reverse=True)[:10]
        for idx, rec in enumerate(all_sorted_new, 1):
            print(f"   {idx:2d}. Product ID: {rec['product_id']:3d} | Predicted Rating: {rec['predicted_rating']:.4f}")
    
    print("\n" + "=" * 60)
    print("TEST COMPLETE!")
    print("=" * 60)

if __name__ == '__main__':
    test_model()
