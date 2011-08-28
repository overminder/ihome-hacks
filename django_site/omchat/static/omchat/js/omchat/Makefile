all : dev
	

dev : soys main-deps.js
	

deploy : soys main-compiled.js
	


soys : *.soy
	~/src/goog-closure/scripts/buildsoys


main-deps.js :
	~/src/goog-closure/library/bin/calcdeps.py \
		--dep=../goog-closure/library/goog/ \
		--path=./ \
		--path=../cBackbone \
		--path=../goog-closure/templates/soyutils.js \
		--path=../goog-closure/templates/soyutils_usegoog.js \
		--output_mode=deps \
		> main-deps.js


main-compiled.js :
	/home/overmind/src/goog-closure/library/bin/build/closurebuilder.py \
	    --root=/home/overmind/src/goog-closure/library/goog/ \
	    --root=/home/overmind/src/goog-closure/templates/ \
	    --root=./ \
	    --root=../cBackbone \
	    --root=/home/overmind/src/goog-closure/third_party/closure/goog/ \
	    --namespace="omchat.main" \
	    --output_mode=compiled \
	    --compiler_jar=/home/overmind/src/goog-closure/compiler/compiler.jar \
	    --compiler_flags='--compilation_level=ADVANCED_OPTIMIZATIONS' \
	    > main-compiled.js


clean :
	rm -f main-deps.js main-compiled.js *.soy.js

