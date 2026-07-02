from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Task


class TaskAuthTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username='demo',
            email='demo@example.com',
            password='demo1234',
        )
        Task.objects.create(owner=self.user, title='Tâche de test', description='desc')

    def test_list_tasks_requires_valid_bearer_token(self):
        response = self.client.get('/api/tasks/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        response = self.client.get('/api/tasks/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['title'], 'Tâche de test')
