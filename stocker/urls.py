from django.conf.urls import patterns, include, url

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    url(r'^html/(.*)/$', 'stocker.views.general.html' ),
    url(r'^JS/(.*)$', 'stocker.views.general.js' ),
    url(r'^css/(.*)$', 'stocker.views.general.css' ),
    url(r'^stock/(.*)/(.*)/(.*)/$', 'stocker.views.general.stock' ),
    url(r'$', 'stocker.views.general.main' ),
    # url(r'^stocker/', include('stocker.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
)
