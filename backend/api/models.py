from django.db import models

class Threat(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending AI Analysis'),
        ('verified', 'Verified Threat'),
        ('rejected', 'Rejected'),
    ]
    lat = models.FloatField()
    lng = models.FloatField()
    image_url = models.URLField(blank=True, null=True)
    type = models.CharField(max_length=50, default='unknown')
    title = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.status})"
