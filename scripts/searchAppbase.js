(function($) {
	$.fn.searchAppbase = function(searchIndexUrl) {
		
		var searchIndex, searchStore;
		//Create the search input element and insert it into html
		var $search = $('<input>').attr({
			'class':"search_field form-control dropdown-toggle",
			'type':'text',
			'placeholder':'search'
		});
		$(this).html($search);
		$search.addClass('appbase-search');

		function buildSearchResult(item, ref) {
			var linkEl = $('<a>').addClass('result_record_a pointer').attr({'link':ref}).text(item.title);
			var resultEl = $('<div>').addClass('result_record').append(linkEl);
			resultEl.on('click',function(){
				gotoLink(this);
			});
			return resultEl;
		}
		var fail = function(e) {
			console.error("Your search index wasn't loaded, please check the following error", e);
		};
		var success = function(serialized) {
			if(serialized.index) {
				searchIndex = lunr.Index.load(serialized.index);
				searchStore = serialized.store;
				
				$search.typeahead({
					minlength: 1
				}, {
					name: 'titles',
					displaykey: 'title',
					source: function(query, cb) {
						cb(searchIndex.search(query));
					},
					templates: {
						pending: true,
						suggestion: function(data) {
							if (data) {
								var item = searchStore[data.ref]; //get details about the found item
								return buildSearchResult(item, data.ref); //build up single result
							} else
								return;
						}
					},
					limit: 10
				});

				$search.bind('typeahead:open', function(ev, suggestion) {
					$search.parents('.search-form').addClass('open');
				});
				$search.bind('typeahead:close', function(ev, suggestion) {
					$search.parents('.search-form').removeClass('open');
				});
				$search.on('keyup', function() {
					var searchtext = $(this).val();
					$('.content').removeHighlight().highlight(searchtext);
				});
				setQueryText();		
			} else {
				fail();
			}
		};
		//goto page with query string
		var gotoLink = function(eve) {
			var linkMode = $(eve).attr('link');
			var fullLink = linkMode+'?q='+$search.val();
			window.location.href = fullLink;
		};
		//set initial higlhight according to previous page query
		var setQueryText = function(){
			var winhref = window.location.href;
			if(winhref.indexOf('?q=') != -1){
				var queryText = winhref.substring(winhref.indexOf('?q=')+3,winhref.lastIndexOf('#')).replace(/%20/g,' ');
				$search.val(queryText);
				$search.trigger('keyup');
			}
		};
		//Fetch search index json data
		var intializeCall = function() {
			$.get(searchIndexUrl)
				.then(success)
				.fail(fail);
		};
		
		intializeCall();

	};
}(jQuery));

(function($) {
	$.fn.highlight = function(pat) {
		var successCount = 0;
		function innerHighlight(node, pat) {
			var skip = 0;
			if (node.nodeType == 3) {
				var pos = node.data.toUpperCase().indexOf(pat);
				if (pos >= 0) {
					successCount++;
					var spannode = document.createElement('span');
					spannode.className = 'highlight';
					var middlebit = node.splitText(pos);
					var endbit = middlebit.splitText(pat.length);
					var middleclone = middlebit.cloneNode(true);
					spannode.appendChild(middleclone);
					middlebit.parentNode.replaceChild(spannode, middlebit);
					skip = 1;
				}
			} else if (node.nodeType == 1 && node.childNodes && !/(script|style)/i.test(node.tagName)) {
				for (var i = 0; i < node.childNodes.length; ++i) {
					if(successCount > 100) {
						break;
					}
					i += innerHighlight(node.childNodes[i], pat);
				}
			}
			return skip;
		}
		return this.length && pat && pat.length ? this.each(function() {
			innerHighlight(this, pat.toUpperCase());
		}) : this;
	};
}(jQuery));

(function($) {
	$.fn.removeHighlight = function() {
		return $(this).find('span.highlight').each(function(){
		   $(this).replaceWith($(this).text());     
		}).end().each(function() {
		    this.normalize();
		});
	};
}(jQuery));