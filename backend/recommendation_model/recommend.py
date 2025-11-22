#!/usr/bin/env python3
# recommend.py
# Generate product recommendations using trained SVD model

import sys
import json
import pickle
import numpy as np
from pathlib import Path

def load_model_files():
    """Load the pickle files from the recommendation_model folder"""
    model_dir = Path(__file__).parent
    
    with open(model_dir / 'svd_model.pkl', 'rb') as f:
        svd_model = pickle.load(f)
    
    with open(model_dir / 'user_item_index.pkl', 'rb') as f:
        user_index = pickle.load(f)
    
    with open(model_dir / 'user_item_columns.pkl', 'rb') as f:
        item_columns = pickle.load(f)
    
    # Load the original user-item matrix (required for actual user data)
    try:
        with open(model_dir / 'user_item_matrix.pkl', 'rb') as f:
            user_item_matrix = pickle.load(f)
    except FileNotFoundError:
        user_item_matrix = None
    
    return svd_model, user_index, item_columns, user_item_matrix


def get_recommendations(user_id, svd_model, user_index, item_columns, user_item_matrix=None, top_n=10, min_rating=4.0):
    """
    Generate top-N recommendations for a user with predicted ratings >= min_rating
    
    Args:
        user_id: Database user ID
        svd_model: Trained TruncatedSVD model
        user_index: Dict mapping user_id -> row index in training matrix
        item_columns: List of product_ids in column order
        user_item_matrix: Original user-item interaction matrix (DataFrame or None)
        top_n: Number of recommendations to return
        min_rating: Minimum predicted rating threshold
    
    Returns:
        List of dicts with product_id and predicted_rating
    """
    num_items = len(item_columns)
    
    # Check if user exists in training data
    if user_id in user_index and user_item_matrix is not None:
        # Existing user: get their actual interaction row from the matrix
        user_row = user_item_matrix.loc[user_id].values.reshape(1, -1)
        # Get items the user already rated (to exclude from recommendations)
        rated_items = user_item_matrix.loc[user_id][user_item_matrix.loc[user_id] > 0].index.tolist()
        
        # Transform user row to latent space
        user_factors = svd_model.transform(user_row)
        # Compute predicted ratings for all items
        predicted_ratings = np.dot(user_factors, svd_model.components_)[0]
    else:
        # New user (cold start): Use mean of all training users to generate popular items
        # Calculate mean latent factors from all users in training data
        if user_item_matrix is not None:
            all_user_factors = svd_model.transform(user_item_matrix.values)
            user_factors = np.mean(all_user_factors, axis=0).reshape(1, -1)
        else:
            # Fallback: use zero vector
            user_row = np.zeros((1, num_items))
            user_factors = svd_model.transform(user_row)
        
        # Compute predicted ratings for all items
        predicted_ratings = np.dot(user_factors, svd_model.components_)[0]
        rated_items = []
    
    # Create list of (product_id, predicted_rating) tuples, excluding already rated items
    recommendations = []
    for i in range(num_items):
        product_id = int(item_columns[i])
        if product_id not in rated_items:
            recommendations.append({
                'product_id': product_id,
                'predicted_rating': float(predicted_ratings[i])
            })
    
    # Filter by minimum rating threshold
    recommendations = [r for r in recommendations if r['predicted_rating'] >= min_rating]
    
    # Sort by predicted rating descending
    recommendations.sort(key=lambda x: x['predicted_rating'], reverse=True)
    
    # Return top N
    return recommendations[:top_n]


def main():
    """Main entry point called from Node.js"""
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'User ID required'}))
        sys.exit(1)
    
    try:
        user_id = int(sys.argv[1])
        top_n = int(sys.argv[2]) if len(sys.argv) > 2 else 10
        min_rating = float(sys.argv[3]) if len(sys.argv) > 3 else 4.0
        
        # Load model files
        svd_model, user_index, item_columns, user_item_matrix = load_model_files()
        
        # Generate recommendations
        recommendations = get_recommendations(
            user_id, svd_model, user_index, item_columns, user_item_matrix, top_n, min_rating
        )
        
        # Output JSON to stdout
        result = {
            'user_id': user_id,
            'recommendations': recommendations,
            'count': len(recommendations)
        }
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({'error': str(e)}), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
