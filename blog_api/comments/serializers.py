from rest_framework import serializers
from .models import Comment


class CommentSerializer(serializers.ModelSerializer):
    author = serializers.ReadOnlyField(source='author.username')

    class Meta:
        model = Comment
        fields = ['id', 'article', 'author', 'content', 'created_at']
        read_only_fields = ['id', 'author', 'created_at']