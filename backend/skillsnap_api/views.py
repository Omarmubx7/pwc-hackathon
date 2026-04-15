import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from .services import run_match_pipeline


@csrf_exempt
@require_POST
def match_cv(request):
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except (TypeError, ValueError, json.JSONDecodeError):
        return JsonResponse({"error": "Invalid JSON payload."}, status=400)

    cv_text = payload.get("cv_text", "")
    skills = payload.get("skills", [])

    if not cv_text and not skills:
        return JsonResponse(
            {"error": "Provide cv_text or skills."},
            status=400,
        )

    try:
        result = run_match_pipeline(cv_text=cv_text, skills=skills)
    except Exception:
        return JsonResponse(
            {
                "error": "Failed to compute matches. Ensure PostgreSQL is running and jobs table is populated."
            },
            status=500,
        )

    return JsonResponse(result, status=200)
