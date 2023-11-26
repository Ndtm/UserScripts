// ==UserScript==
// @name         All Recent Titles
// @namespace    Ndtm_ART
// @version      0.4
// @description  Gib all Titles plz
// @author       Ndtm
// @match        https://mangadex.org/*
// @match        https://canary.mangadex.dev/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mangadex.org
// @run-at       document-start
// @grant        unsafeWindow
// @grant        GM_setValue
// @grant        GM_getValue
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
	//if(GM_info.isIncognito){
	let hasChapters = [];
		const origFetch = unsafeWindow.fetch.bind(unsafeWindow);
		unsafeWindow.fetch = async function(...args){
			if(GM_getValue('showAll',true)&&document.location.pathname.startsWith('/titles/recent')&&/https:\/\/api.mangadex/.test(args[0])){
				args[0] = args[0].replaceAll(/&?(?:(?:hasAvailableChapters=[\w\d]+)|(?:availableTranslatedLanguage[^&]+))(?:(?<!&[^&]+)&)?/g,'');
				if(true&&/^https:\/\/api.mangadex.(?:org|dev)\/manga\?/.test(args[0])){ //Show What Entries Have Chapters
					const response = await origFetch(...args);
					response.clone().json().then(res => {
						if(res.result === 'ok'){
							const resTotal = res.data.length;
							document.body.waitOn(`.md-content > .page-container div.grid > div:first-child:nth-last-child(${resTotal}),div:first-child:nth-last-child(${resTotal}) ~ div.manga-card`,true).then(nodes => {
								hasChapters.length = 0;
								nodes.forEach((node,index) => {
									hasChapters.push(res.data[index].attributes.latestUploadedChapter !== null)
									if(hasChapters[index]){
										node.classList.add('md-hasChapterTitle');
									}
								});
							});
						};
					}).catch(err => {});
					return response;
				}
			}
			return await origFetch(...args);
		}
		const checkboxChecked = `<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path><path stroke="rgb(var(--md-primary))" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 11 3 3L22 4"></path>`;
		const checkboxEmpty = `<rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>`;
		const checkbox = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="cursor-pointer feather feather-square icon text-icon-contrast text-undefined" style="display: inline-block;" viewBox="0 0 24 24"></svg>`;
		let container;
		window.addEventListener('urlchange', ({ url }) => {
			if(document.location.pathname.startsWith('/titles/recent')&&!document.documentElement.querySelector('div.md-content span#ShowAllContainer')){
				document.documentElement.waitOn('div.md-content > div > div:not([class]) > div.flex-row > div[class]').then(node => {
					node = node.parentElement;
					if(!container) makeContainer(node);
					node.prepend(container);
					Array.from(node.querySelectorAll('.controls > .item')).forEach(elem=>{elem.addEventListener('click',function(e){reAddIndicator(elem)})})
				})
			}
		});
		function reAddIndicator(elem){
			if(hasChapters.length && document.body.querySelector('.md-hasChapterTitle') === null){
				Array.from(elem.closest('div:not([class])').querySelector('.grid').children).forEach((node,index) => {
					if(hasChapters[index]){
						node.classList.add('md-hasChapterTitle');
					}
				});
			}
		}
		function makeContainer(node){
			container = document.createElement('span');
			container.style.alignItems = 'center';
			container.style.display = 'flex';
			container.id = 'ShowAllContainer';
			container.innerHTML = checkbox;
			let svg = container.firstElementChild;
			svg.innerHTML = GM_getValue('showAll',true) ? checkboxChecked : checkboxEmpty;
			container.append('Show All');
			svg.addEventListener('click',function(e){
				GM_setValue('showAll',!GM_getValue('showAll',true));
				location.reload();
			})
			//Style For Has Chapters Indicator
			let cstyle = document.createElement('style');
			document.head.appendChild(cstyle);
			cstyle.innerHTML = `
			.md-hasChapterTitle::after {
			  content: '';
			  width: 0;
			  height: 0;
			  border-style: solid;
			  border-width: 0 12px 12px 0;
			  border-color: transparent rgb(var(--md-status-green)) transparent transparent;
			  right: 0;
			  top: 0;
			  position: absolute;
			}`;
		}
	//}
})();
