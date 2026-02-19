FaceAlbum

FaceAlbum is a Node.js web application that automatically groups photos of visually similar people into albums.
The system converts images into vector embeddings using a CNN model, then applies the DBSCAN clustering algorithm to detect groups of similar faces without requiring the number of people in advance.

🚀 Features

Upload and process image collections

Face detection & preprocessing

CNN-based feature extraction (image → vector embeddings)

Density-based clustering with DBSCAN

Automatic grouping of visually similar faces

Interactive gallery UI for browsing albums

Noise/outlier handling via DBSCAN

Scalable processing pipeline

🧠 How It Works

FaceAlbum uses a standard face-recognition pipeline:

Image Ingestion
Images are uploaded or imported into the system.

Face Processing
Faces are detected and aligned for consistency.

Feature Extraction (CNN)
Each face is passed through a convolutional neural network (CNN) to generate a fixed-length vector embedding representing facial features.

Clustering (DBSCAN)
Embeddings are grouped using DBSCAN, which:

Does not require specifying cluster count

Handles noise and outliers naturally

Works well for similarity-based grouping

Album Generation
Each cluster becomes a photo album of similar faces.

🛠 Tech Stack

Backend: Node.js (Express)

ML / Embeddings: CNN Model (TensorFlow / PyTorch / TensorFlow.js)

Clustering: DBSCAN

Frontend: HTML / CSS / JS (or React/Vue if applicable)

Storage: Local filesystem / database (project dependent)
