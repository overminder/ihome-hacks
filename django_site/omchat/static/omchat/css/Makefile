
site.less.css : site.less notless.css goog-specific.css
	cat notless.css goog-specific.css site.less > tmp.less
	lessc tmp.less -x > site.less.css
	rm tmp.less

clean :
	rm site.less.css
