// ==UserScript==
// @name         All Recent Titles Alt
// @namespace    Ndtm_ART_A
// @version      0.1
// @description  Puts a link to an Adv Search predefined filter on the recents page
// @author       Ndtm
// @match        https://mangadex.org/*
// @match        https://canary.mangadex.dev/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mangadex.org
// @run-at       document-idle
// @grant        window.onurlchange
// ==/UserScript==

(function() {
	'use strict';
	if(!HTMLElement.prototype.waitOn){
		HTMLElement.prototype.waitOn = function(sel,multi = false,timeout = 0){
			return new Promise((resolve,reject) => {
				if(typeof(sel) !== 'string') reject('Selector is not a string');
				try{document.querySelector(sel)}catch(err){reject('Selector isn\'t valid css')}
				if(typeof(multi) !== 'boolean') reject('MultiSelector is not a bool');
				if(typeof(timeout) !== 'number'||Number.isNaN(Number.parseInt(timeout))) reject('Timeout is Invalid');
				const queryFunc = multi ? this.querySelectorAll.bind(this) : this.querySelector.bind(this);
				let testQuery = queryFunc(sel);
				if(multi&&!testQuery.length) testQuery = null;
				if(testQuery!==null) return resolve(testQuery);
				let timer;
				const observer = new MutationObserver((mutations)=>{
					for(const mutation of mutations){
						if(mutation.type === "childList" && mutation.addedNodes){
							const query = queryFunc(sel);
							if(multi&&!query.length) query = null;
							if(query!==null){
								clearTimeout(timer);
								observer.disconnect();
								resolve(query);
							}
						}
					}
				});
				observer.observe(this,{childList:true, subtree:true});
				if(timeout > 0) timer = setTimeout(()=>{observer.disconnect();reject(new Error('WaitOn time Exceeded'))},timeout);
			});
		}
	}
	let addedWaitOn = false;
	window.addEventListener('urlchange', ({ url }) => {
		if(document.location.pathname.startsWith('/titles/recent')&&!addedWaitOn&&!document.documentElement.querySelector('div.md-content a#searchFilterLink')){
			addedWaitOn = true;
			document.documentElement.waitOn('div.md-content > div > div:not([class]) > div.flex-row > div[class]').then(node => {
				addedWaitOn = false;
				node = node.parentElement;
				makeLink(node);
			})
		}
	});
	function makeLink(node){
		let container = document.createElement('span');
		container.style.alignItems = 'center';
		container.style.display = 'flex';
		let theLink = document.createElement('a');
		theLink.id = 'searchFilterLink';
		theLink.classList.add('text-primary','hover:underline')
		theLink.textContent = "Show All";
		theLink.href = 'https://'+document.location.hostname+'/titles?order=createdAt.desc';
		container.append(theLink);
		node.prepend(container);
	}
})();
