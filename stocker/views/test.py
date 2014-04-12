from django.shortcuts import render_to_response

def test_view(request,data):
    return render_to_response(data+'.html', {'name': 'noam'})