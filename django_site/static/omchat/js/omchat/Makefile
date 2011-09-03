SRC = ep.js view.js comet.js conf.js models.js templates.soy.js \
      ui.js util.js

all : dev

dev : soys _build/ep-deps.js
	

deploy : soys _build/ep-compiled.js
	

soys : templates.soy.js


templates.soy.js : templates.soy
	~/src/goog-closure/scripts/buildsoys


# relative path is needed to build deps when we are in develop phase
_build/ep-deps.js : $(SRC)
	~/src/goog-closure/library/bin/calcdeps.py \
		--dep=../goog-closure/library/goog/ \
		--path=./ \
		--path=../cBackbone \
		--path=../goog-closure/third_party/closure/goog/ \
		--path=../goog-closure/templates/soyutils.js \
		--path=../goog-closure/templates/soyutils_usegoog.js \
		--output_mode=deps \
		> _build/ep-deps.js


_build/ep-compiled.js : $(SRC)
	/home/overmind/src/goog-closure/library/bin/build/closurebuilder.py \
	    --root=/home/overmind/src/goog-closure/library/goog/ \
	    --root=/home/overmind/src/goog-closure/templates/ \
	    --root=./ \
	    --root=../cBackbone \
	    --root=/home/overmind/src/goog-closure/third_party/closure/goog/ \
	    --namespace="omchat.ep" \
	    --output_mode=compiled \
	    --compiler_jar=/home/overmind/src/goog-closure/compiler/compiler.jar \
	    --compiler_flags='--compilation_level=ADVANCED_OPTIMIZATIONS' \
	    > _build/ep-compiled.js


clean :
	rm -f _build/* *.soy.js

