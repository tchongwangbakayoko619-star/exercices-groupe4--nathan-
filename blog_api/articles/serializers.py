from rest_framework import serializers
from .models import Article


class ArticleSerializer(serializers.ModelSerializer):
    author = serializers.ReadOnlyField(source='author.username')
    comments = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = ['id', 'title', 'content', 'author', 'created_at', 'comments']
        read_only_fields = ['id', 'author', 'created_at', 'comments']

    def get_comments(self, obj):
        from comments.serializers import CommentSerializer
        return CommentSerializer(obj.comments.all(), many=True).data