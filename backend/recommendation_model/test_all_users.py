#!/usr/bin/env python3
# test_all_users.py
# Test recommendations for all users in the training data

import sys
import pickle
import numpy as np
from pathlib import Path

def test_all_users():
    """Test recommendations for all users"""
    model_dir = Path(__file__).parent
    
    print("=" * 70)
    print("TESTING RECOMMENDATIONS FOR ALL USERS")
    print("=" * 70)
    
    # Load all pickle files
    print("\nLoading pickle files...")
    with open(model_dir / 'svd_model.pkl', 'rb') as f:
        svd_model = pickle.load(f)
    with open(model_dir / 'user_item_index.pkl', 'rb') as f:
        user_index = pickle.load(f)
    with open(model_dir / 'user_item_columns.pkl', 'rb') as f:
        item_columns = pickle.load(f)
    with open(model_dir / 'user_item_matrix.pkl', 'rb') as f:
        user_item_matrix = pickle.load(f)
    
    print(f"✅ Loaded: {len(user_index)} users, {len(item_columns)} items")
    
    # Test different thresholds
    thresholds = [4.0, 3.5, 3.0, 2.5, 2.0]
    
    print("\n" + "=" * 70)
    print("TESTING DIFFERENT RATING THRESHOLDS")
    print("=" * 70)
    
    for threshold in thresholds:
        users_with_recs = 0
        total_recs = 0
        
        for user_id in user_item_matrix.index[:20]:  # Test first 20 users
            # Get user's actual ratings
            user_row = user_item_matrix.loc[user_id].values.reshape(1, -1)
            rated_items = user_item_matrix.loc[user_id][user_item_matrix.loc[user_id] > 0].index.tolist()
            
            # Transform to latent space
            user_factors = svd_model.transform(user_row)
            predicted_ratings = np.dot(user_factors, svd_model.components_)[0]
            
            # Get recommendations (excluding already rated items)
            recommendations = []
            for i, product_id in enumerate(item_columns):
                if product_id not in rated_items:
                    pred_rating = float(predicted_ratings[i])
                    if pred_rating >= threshold:
                        recommendations.append({
                            'product_id': int(product_id),
                            'predicted_rating': pred_rating
                        })
            
            if len(recommendations) > 0:
                users_with_recs += 1
                total_recs += len(recommendations)
        
        print(f"\nThreshold >= {threshold}:")
        print(f"  Users with recommendations: {users_with_recs}/20 ({users_with_recs*5}%)")
        print(f"  Average recommendations per user: {total_recs/20:.1f}")
    
    # Detailed analysis for first 10 users
    print("\n" + "=" * 70)
    print("DETAILED ANALYSIS - FIRST 10 USERS (min_rating=3.0)")
    print("=" * 70)
    
    for user_id in list(user_item_matrix.index)[:10]:
        user_row = user_item_matrix.loc[user_id].values.reshape(1, -1)
        rated_items = user_item_matrix.loc[user_id][user_item_matrix.loc[user_id] > 0].index.tolist()
        
        user_factors = svd_model.transform(user_row)
        predicted_ratings = np.dot(user_factors, svd_model.components_)[0]
        
        # Get all predictions
        all_preds = []
        for i, product_id in enumerate(item_columns):
            if product_id not in rated_items:
                all_preds.append({
                    'product_id': int(product_id),
                    'predicted_rating': float(predicted_ratings[i])
                })
        
        all_preds.sort(key=lambda x: x['predicted_rating'], reverse=True)
        recs_above_3 = [r for r in all_preds if r['predicted_rating'] >= 3.0]
        
        print(f"\nUser {user_id}:")
        print(f"  Rated items: {len(rated_items)}")
        print(f"  Unrated items: {len(all_preds)}")
        print(f"  Recommendations >= 3.0: {len(recs_above_3)}")
        if len(all_preds) > 0:
            print(f"  Highest predicted rating: {all_preds[0]['predicted_rating']:.4f} (Product {all_preds[0]['product_id']})")
            print(f"  Top 3 predictions:")
            for rec in all_preds[:3]:
                print(f"    - Product {rec['product_id']:3d}: {rec['predicted_rating']:.4f}")
    
    print("\n" + "=" * 70)

if __name__ == '__main__':
    test_all_users()
