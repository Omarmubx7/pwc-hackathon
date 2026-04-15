from django.http import HttpResponse


ALLOWED_ORIGINS = {
    "http://localhost:5173",
    "http://127.0.0.1:5173",
}


def simple_cors_middleware(get_response):
    def middleware(request):
        origin = request.headers.get("Origin", "")

        if request.method == "OPTIONS":
            response = HttpResponse(status=204)
        else:
            response = get_response(request)

        if origin in ALLOWED_ORIGINS:
            response["Access-Control-Allow-Origin"] = origin
            response["Vary"] = "Origin"

        response["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response["Access-Control-Allow-Credentials"] = "true"

        return response

    return middleware
