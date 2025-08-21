var dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
var day;// = dayOfWeek[(new Date()).getDay()].toLowerCase();
var timeOffset = (new Date()).getTimezoneOffset() / 60;
let wakeLock = null;
var wlSupp = false;
var gameDesc;
var dateForYear = new Date();
var twos = ["home","away"];
const baseURL = "https://statsapi.mlb.com";
var vars;
var uRL;
var hideCode = "";
var curPitch;
var curBat;
var historicGame = false;
var r = document.querySelector(':root');
window.onload = function() {
	var extUrl = "/api/v1/schedule?sportId=1,51,22,11,12,13,14,15,16,17,5442&hydrate=linescore,broadcasts";
	var que = window.location.search.substring(1);
	if (que.length > 0) {
		historicGame = true;
		extUrl+="&date=" + que;
	}
	getData(baseURL + extUrl).then((value) => {
		console.log(value);
		if (value.dates.length > 0) {
			if (!historicGame) {
				g = value.dates[0].games.filter(e => e.status.statusCode != "S" && e.status.codedGameState != "F");
			} else {
				g = value.dates[0].games;
			}
			if (value.dates[0].games.length > 15) {
				g = g.sort((a,b) => {
					return a.teams.home.team.id - b.teams.home.team.id;
				});
			}
		} else {
			g = [];
		}
		tab = document.createElement("table");
		for (var i = 0; i < g.length/3; i++) {
			row = document.createElement("tr");
			for (var j = i * 3; j < i*3+3 && j < g.length; j++) {
				var bcast;
				if (g[j].broadcasts) {
					bcast = g[j].broadcasts.filter(e => e.type=="TV");
				} else {
					bcast = [];
				}
				console.log(bcast);
				if (g[j].teams.away.score!=null && g[j].teams.home.score!=null) {
					game = document.createElement("td");
					if (g[j].status.statusCode == "P") {
						game.innerHTML = g[j].teams.away.team.name + " @ " + g[j].teams.home.team.name + "<br/>First Pitch: " + getGameTime(g[j].gameDate);
					} else {
						if (g[j].linescore) {
						game.innerHTML = g[j].teams.away.team.name + " " + g[j].teams.away.score + " @ " + g[j].teams.home.team.name + " " + g[j].teams.home.score+"<br/>"+g[j].linescore.inningState+ " " + g[j].linescore.currentInningOrdinal + ", " + g[j].linescore.outs + " outs";
						if (g[j].status.statusCode != g[j].status.codedGameState) {
							game.innerHTML+= " ("+g[j].status.detailedState+")";
						}
						}
					}
					game.innerHTML+= "<br/>TV: ";
					for (var k = 0; k < bcast.length; k++) {
						if (k < bcast.length - 1 && bcast[k].id == bcast[k+1].id) {
							console.log(k);
							continue;
						}
						game.innerHTML+= bcast[k].callSign;
						if (k < bcast.length - 1) {
							game.innerHTML+= ",";
						}
					}
					if (bcast.length == 0) {
						game.innerHTML += "none";
					}
					if (g[j].gameType != "R" && g[j].gameType != "S") {
						if (!historicGame) {
							game.setAttribute("onclick","runGD(\""+baseURL+g[j].link+"\",\""+ g[j].description +"\")");
						} else {
							game.setAttribute("onclick","runHistGD(\""+baseURL+g[j].link+"\",\""+ g[j].description +"\")");
						}
					} else {
							if (!historicGame) {
								game.setAttribute("onclick","runGD(\""+baseURL+g[j].link+"\")");
							} else {
								game.setAttribute("onclick","runHistGD(\""+baseURL+g[j].link+"\")");
							}
					}
					row.appendChild(game);
				}  else if (g[j].status.statusCode != g[j].status.codedGameState) {
					game = document.createElement("td");
					game.innerHTML = g[j].teams.away.team.name + " @ " + g[j].teams.home.team.name + "<br/>" + g[j].status.detailedState + " - " + g[j].status.reason;
					row.appendChild(game);
				} else if (g[j].status.statusCode == "P") {
					game = document.createElement("td");
					game.innerHTML = g[j].teams.away.team.name + " @ " + g[j].teams.home.team.name + "<br/>First Pitch: " + getGameTime(g[j].gameDate);
					if (g[j].linescore.offense.battingOrder && g[j].linescore.defense.battingOrder) {
						if (g[j].gamedayType == "P") {
							game.setAttribute("onclick","runGD(\""+baseURL+g[j].link+"\",\""+ g[j].description +"\")");
						} else {
								game.setAttribute("onclick","runGD(\""+baseURL+g[j].link+"\")");
							}
					}
					row.appendChild(game);
				}
			}
			tab.appendChild(row);
		}
		// document.getElementById("scores").innerHTML = "";
		document.getElementById("scores").appendChild(tab);
		if (g.length == 0) {
			document.getElementById("scores").innerHTML += "<table><td>No active games</td></table>";
		}
});
}
function gameDay() {
	url = uRL;
	console.log(url);
	getData(url).then((value) => {
		console.log(value);
		// if (value.liveData.plays.currentPlay.about.isTopInning) {
			pitchDisplay(value,"home");
		// } else {
			pitchDisplay(value,"away");
		// }
	});
	
}
function runGD(url, desc="") {
	document.getElementById("sett").className +=" gameOn";
	uRL = url;
	gameDay();
	if (desc.length > 0) {
		var splText = splitInHalf(desc);
		document.getElementById("awayDesc").innerHTML = splText[0];
		// document.getElementById("awayDesc").after(document.createElement("br"));
		document.getElementById("homeDesc").innerHTML = splText[1];
		// document.getElementById("homeDesc").after(document.createElement("br"));
	}
	run = setInterval(gameDay,10000);
}
async function runHistGD(url, desc="", startInd=0) {
	document.getElementById("nextPlay").removeAttribute("hidden");
	startingNum = startInd;
	iterate = startInd;
	if (desc.length > 0) {
		gameDesc = desc;
		var splText = splitInHalf(desc);
		document.getElementById("awayDesc").innerHTML = splText[0];
		// document.getElementById("awayDesc").after(document.createElement("br"));
		document.getElementById("homeDesc").innerHTML = splText[1];
		// document.getElementById("homeDesc").after(document.createElement("br"));
	}
	var stamps;
	document.getElementById("sett").className+=" gameOn";
	await getData(url+"/timestamps").then((sTamps) => {
		stamps = sTamps;
	});
			// var iterate = 0;
		for (var i = iterate; i < stamps.length; i++) {
			if (startingNum != startInd) {
				break;
			}
			iterate = i;
			uRL = url + "?timecode="+stamps[i];
			gameDay();
			if (i+1 != stamps.length) {
				await timeout(timeDiff(stamps[i],stamps[i+1]));
			}
		}
}
function nextPlay() {
	iterate++;
	runHistGD(uRL.split("?")[0],gameDesc || "",iterate);
}

async function pitchDisplay(game,ha) {
	try {
		if (!wlSupp && game.gameData.status.codedGameState != "F") {
			wlSupp = true;
			wakeLock = await navigator.wakeLock.request("screen");
			wakeLock.addEventListener("release", () => {
				// the wake lock has been released
				console.log("Wake Lock has been released");
				});
			console.log("Wake Lock is active!");
		} else if (wlSupp && game.gameData.status.codedGameState == "F") {
			wakeLock.release();
		}
	} catch (err) {
		// The Wake Lock request has failed - usually system related, such as battery.
		console.log(err);
	}
	var r1;
	var r2;
	var r3;
	var loaded;
	var risp2;
	var r3l2;
	var popUp = document.getElementById("popText");
	await timeout(document.getElementById("offset").value * 1000);
	if (game.gameData.status.statusCode != "I" && game.gameData.status.statusCode != "PW" && game.gameData.status.statusCode != hideCode) {
		popUp.parentElement.style.display = "block";
		popUp.innerText = game.gameData.status.detailedState;
		if (game.gameData.status.statusCode == "P") {
			popUp.innerHTML += "<br/>First Pitch: " + getGameTime(game.gameData.datetime.dateTime);
		}
		document.getElementById("close").setAttribute("onclick","hideModal(\""+game.gameData.status.statusCode+"\")");
	} else {
		popUp.parentElement.style.display = "none";
		popUp.innerHTML = "";
		if (hideCode != game.gameData.status.statusCode) {
			hideCode = "";
		}
	}
	if (game.gameData.review) {
		document.getElementById(ha+"Challenges").innerText = game.gameData.review[ha].remaining + " Challenge";
		if (game.gameData.review[ha].remaining != 1) {
			document.getElementById(ha+"Challenges").innerText += "s";
		}
		document.getElementById(ha+"Challenges").innerText += " Remaining";
	}
	if (game.gameData.absChallenges) {
		document.getElementById(ha+"Challenges").innerHTML += "<br/>" + game.gameData.absChallenges[ha].remaining + " ABS Challenge";
		if (game.gameData.absChallenges[ha].remaining != 1) {
			document.getElementById(ha+"Challenges").innerHTML += "s";
		}
		document.getElementById(ha+"Challenges").innerHTML +=" Remaining";
	}
	if (game.gameData.flags[ha+"TeamPerfectGame"] && !document.getElementById(ha+"Desc").innerHTML.includes("Perfect")) {
		document.getElementById(ha+"Desc").innerHTML+= "<br/>Perfect Game Watch";
	} else if (!game.gameData.flags[ha+"TeamPerfectGame"] && document.getElementById(ha+"Desc").innerHTML.includes("Perfect")) {
		document.getElementById(ha+"Desc").innerHTML = document.getElementById(ha+"Desc").innerHTML.replaceAll("Perfect Game Watch","");
	}
	if (game.gameData.flags[ha+"TeamNoHitter"] && !document.getElementById(ha+"Desc").innerHTML.includes("No-Hitter")) {
		document.getElementById(ha+"Desc").innerHTML+= "<br/>No-Hitter Watch";
	} else if (!game.gameData.flags[ha+"TeamNoHitter"] && document.getElementById(ha+"Desc").innerHTML.includes("No-Hitter")) {
		document.getElementById(ha+"Desc").innerHTML = document.getElementById(ha+"Desc").innerHTML.replaceAll("No-Hitter Watch","");
	}
	document.getElementById("topBot").innerText = game.liveData.linescore.inningState;
	document.getElementById("innNum").innerText = game.liveData.linescore.currentInningOrdinal;
	document.getElementById(ha+"WPImg").src = "https://midfield.mlbstatic.com/v1/team/"+game.gameData.teams[ha].id+"/spots/144";
	if (game.liveData.linescore.offense.first) {
		document.getElementById("firstBase").className+= " runner";
		r1 = true;
		console.log("runner first");
		r.style.setProperty("--first","url("+getPhotoUrl(game.liveData.linescore.offense.first.id)+")");
	} else {
		document.getElementById("firstBase").className = document.getElementById("firstBase").className.replaceAll(" runner","");
		r1 = false;
		r.style.setProperty("--first","url()");
	}
	if (game.liveData.linescore.offense.second) {
		document.getElementById("secondBase").className+= " runner";
		r2 = true;
		r.style.setProperty("--second","url("+getPhotoUrl(game.liveData.linescore.offense.second.id)+")");
	} else {
		document.getElementById("secondBase").className = document.getElementById("secondBase").className.replaceAll(" runner","");
		r2 = false;
		r.style.setProperty("--second","url()");
	}
	if (game.liveData.linescore.offense.third) {
		document.getElementById("thirdBase").className+= " runner";
		r3 = true;
		r.style.setProperty("--third","url("+getPhotoUrl(game.liveData.linescore.offense.third.id)+")");
	} else {
		document.getElementById("thirdBase").className = document.getElementById("thirdBase").className.replaceAll(" runner","");
		r3 = false;
		r.style.setProperty("--third","url()");
	}
	var dayNight = game.gameData.datetime.dayNight;
	day = dayOfWeek[new Date(game.gameData.datetime.dateTime).getDay()].toLowerCase();
	var tmCode = game.gameData.teams[ha].fileCode;
	var isPitch = game.liveData.linescore.isTopInning == (ha == "home");
	if (game.gameData.game.type != "A") {
		// document.getElementById(ha).className = tmCode + " " + ha + " " + dayNight + " " + day;
		getData(baseURL + "/api/v1/uniforms/game?gamePks="+game.gamePk).then((uni) => {
			var jersey;
			try {
				jersey = uni.uniforms[0][ha].uniformAssets.filter(e => e.uniformAssetType.uniformAssetTypeId == 1)[0].uniformAssetCode;
			} catch (err) {
				jersey = "000_" + dayNight + " " + day + "_0000";
			}
			var jerseyCode = jersey.slice(jersey.indexOf("_")+1,-5);
			document.getElementById(ha).className = tmCode + " " + ha + " " + jerseyCode;
			document.getElementById(ha + "WPSpan").className = tmCode + " " + ha + " " + jerseyCode;
		});
	} else {
		var playerTm;
		if (isPitch) {
			var grabber = await getData(baseURL + game.liveData.plays.currentPlay.matchup.pitcher.link+"?hydrate=currentTeam,team(team)").then((lin) => {
				playerTm = lin.people[0].currentTeam.fileCode;
				console.log(playerTm);
			});
		} else {
			var grabber = await getData(baseURL + game.liveData.plays.currentPlay.matchup.batter.link+"?hydrate=currentTeam,team(team)").then((lin) => {
				playerTm = lin.people[0].currentTeam.fileCode;
			});
		}
		// document.getElementById(ha).className = playerTm + " " + ha + " " + dayNight;
		var uniWatch = await getData(baseURL + "/api/v1/uniforms/game?gamePks="+game.gamePk).then((uni) => {
			console.log(tmCode);
			// var jersey = uni.uniforms[0][ha].uniformAssets.filter(e => e.uniformAssetType.uniformAssetTypeId == 1)[0].uniformAssetCode;
			// var jerseyCode = jersey.slice(jersey.indexOf("_")+1,-5);
			document.getElementById(ha).className = playerTm + " " + ha;// + " " + jerseyCode;
			document.getElementById(ha + "WPSpan").className = tmCode + " " + ha;// + " " + jerseyCode;
		});
	}
	if (game.gameType == "S") {
		document.getElementById(ha).className += " spring";
	}
	// document.getElementById(ha + "WPSpan").className = tmCode + " " + ha + " " + dayNight + " " + day;
	// vars = game;
	
	console.log(ha);
	curBat = game.liveData.plays.currentPlay.matchup.batter.id;
	curPitch = game.liveData.plays.currentPlay.matchup.pitcher.id;
	var split;
	if (isPitch) {
		split = "pitcher";
	} else {
		split = "batter";
	}
	var homeAway;
	if (ha == "home") {
		homeAway = "home";
	} else {
		homeAway = "away";
	}
	// var div = document.createElement("div");
	// div.className = "vertJust";
	var pitchID;
	if (isPitch) {
		pitchID = game.liveData.plays.currentPlay.matchup.pitcher.id;
	} else {
		pitchID = game.liveData.plays.currentPlay.matchup.batter.id;
	}
	var top = document.getElementById(ha + "Top");//document.createElement("h2");
	if (ha == "away") {
		top.innerHTML = "<span id=\"awayName\">" + game.gameData.teams.away.clubName + '</span> <span id="awayScore">' + game.liveData.linescore.teams.away.runs+"</span>";
	} else {
		top.innerHTML = "<span id='homeScore'>"+ game.liveData.linescore.teams.home.runs + '</span> <span id="homeName">' + game.gameData.teams.home.clubName+"</span>";
	}
	var img = document.getElementById(ha+"Feat");//createElement("img");
	img.setAttribute("src","https://midfield.mlbstatic.com/v1/people/"+pitchID+"/silo/360");
	if (isPitch) {
		img.setAttribute("alt",game.liveData.plays.currentPlay.matchup.pitcher.fullName);
		document.getElementById(ha+"Nm").setAttribute("alt",game.liveData.plays.currentPlay.matchup.pitcher.fullName);
	} else {
		img.setAttribute("alt",game.liveData.plays.currentPlay.matchup.batter.fullName);
		document.getElementById(ha+"Nm").setAttribute("alt",game.liveData.plays.currentPlay.matchup.batter.fullName);
	}
	//img.className = "featured";
	var summ = document.getElementById(ha+"Summ");//createElement("p");
	if (game.liveData.linescore.isTopInning == (ha == "home")) {
		summ.innerText = game.liveData.boxscore.teams[ha].players["ID"+pitchID].stats.pitching.summary + ", " + (game.liveData.boxscore.teams[ha].players["ID"+pitchID].stats.pitching.pitchesThrown || "0") + " pitches ("  +game.liveData.boxscore.teams[ha].players["ID"+pitchID].stats.pitching.strikes + " strikes)";
	} else {
		summ.innerText = game.liveData.boxscore.teams[ha].players["ID"+pitchID].stats.batting.summary;
	}
	var search = baseURL;
	if (isPitch) {
		console.log(game);
		if (game.gameData.game.type == "S") {
			console.log("spring game");
			search = baseURL + "/api/v1/people/"+ pitchID + "?hydrate=stats(season="+(dateForYear.getFullYear() - 1)+",group=pitching,type=[seasonAdvanced,pitchArsenal,sabermetrics,statSplits,statSplitsAdvanced],sitCodes="+getMatchupData(game.liveData.plays.currentPlay.matchup.splits.pitcher)+")"
		} else {
			if (game.gameData.game.type == "S") {
				search = baseURL + "/api/v1/people/"+ pitchID + "?hydrate=stats(season="+(dateForYear.getFullYear() - 1)+",group=pitching,type=[seasonAdvanced,pitchArsenal,sabermetrics,statSplits,statSplitsAdvanced],sitCodes="+getMatchupData(game.liveData.plays.currentPlay.matchup.splits.pitcher)+")"
			} else {
		search = baseURL + "/api/v1/people/"+ pitchID + "?hydrate=stats(season="+game.gameData.game.season+",group=pitching,type=[seasonAdvanced,pitchArsenal,sabermetrics,statSplits,statSplitsAdvanced],sitCodes="+getMatchupData(game.liveData.plays.currentPlay.matchup.splits.pitcher)+")"
			}
		}
	} else {
		if (game.gameData.game.type == "S") {
			search = baseURL + "/api/v1/people/"+pitchID+"?hydrate=stats(season="+(dateForYear.getFullYear() - 1)+",group=hitting,type=[seasonAdvanced,statSplits,sabermetrics,statSplitsAdvanced],sitCodes=["+getMatchupData(game.liveData.plays.currentPlay.matchup.splits.batter)+",c"+game.liveData.plays.currentPlay.count.balls + game.liveData.plays.currentPlay.count.strikes;
		} else {
		search = baseURL + "/api/v1/people/"+pitchID+"?hydrate=stats(season="+game.gameData.game.season+",group=hitting,type=[seasonAdvanced,statSplits,sabermetrics,statSplitsAdvanced],sitCodes=["+getMatchupData(game.liveData.plays.currentPlay.matchup.splits.batter)+",c"+game.liveData.plays.currentPlay.count.balls + game.liveData.plays.currentPlay.count.strikes;
		}
		if (r1 && r2 && r3) {
			search+=",r123";
			loaded = true;
		} else if ((r2 || r3) && game.liveData.linescore.outs == 2) {
			search+= ",risp2";
			risp2 = true;
		} else if ((r2 || r3) && game.liveData.linescore.outs < 2) {
			search+= ",risp";
			r3l2 = true;
		}
		search+= "])";
	}
	if ((game.gameData.teams.away.sport.id != 1 && game.gameData.teams.away.sport.id != 51) || (game.gameData.teams.home.sport.id != 1 && game.gameData.teams.home.sport.id != 51)) {
		search = search.replaceAll("stats(","stats(leagueListId=milb_all,");
	}
	// if (game.gameData.teams.away.sport.id == 51 && game.gameData.teams.home.sport.id == 51) {
		// search = search.replaceAll("sportId","stats(leagueListId=milb_all,");
	// }
	var pRank;
	var rankUrl = baseURL;
	if (game.gameData.game.type == "P" || game.gameData.game.type == "W" || game.gameData.game.type == "D" || game.gameData.game.type == "L" || game.gameData.game.type == "C") {
		if (isPitch) {
			rankUrl +="/api/v1/stats/leaders?leaderCategories=wins,strikeOuts,saves&statType=career&leaderGameTypes=P&limit=50&statGroup=pitching";
		} else {
			rankUrl+= "/api/v1/stats/leaders?leaderCategories=hits,doubles,triples,homeRuns,rbi&statType=career&leaderGameTypes=P&limit=20&statGroup=hitting";
		}
	}
	else {
		if (isPitch) {
			rankUrl +="/api/v1/stats/leaders?leaderCategories=wins,strikeOuts,saves,era,&statType=statsSingleSeason&leaderGameTypes=R&limit=50&statGroup=pitching&leagueId="+game.gameData.teams[ha].league.id;
		} else {
			rankUrl+= "/api/v1/stats/leaders?leaderCategories=hits,walks,slg,homeRuns,rbi,avg,obp,ops,strikeOuts,totalBases&statType=statsSingleSeason&leaderGameTypes=R&limit=50&statGroup=hitting&leagueId="+game.gameData.teams[ha].league.id;
		}
	}
	// var wP;
	getData(rankUrl).then((ranking) => {
		console.log(ranking);
	pRank = ranking;
	getData(search).then((value) => {
		var srch;
		if (!isPitch) {
			if (game.gameData.game.type == "S") {
				srch = baseURL + "/api/v1/stats?season="+(dateForYear.getFullYear() - 1)+"&group=hitting&sportIds=1&stats=metricAverages&personId="+pitchID+"&metrics=launchSpeed,launchAngle,distance";
			} else {
			srch = baseURL + "/api/v1/stats?group=hitting&sportIds=1&stats=metricAverages&personId="+pitchID+"&metrics=launchSpeed,launchAngle,distance";
			}
		} else {
			if (game.gameData.game.type == "S") {
				srch = baseURL + "/api/v1/stats?season="+(dateForYear.getFullYear() - 1)+"&group=pitching&sportIds=1&stats=metricAverages&metrics=releaseSpinRate&personId="+pitchID;
			} else {
			srch = baseURL + "/api/v1/stats?group=pitching&sportIds=1&stats=metricAverages&metrics=releaseSpinRate&personId="+pitchID;
			}
		}
		// if (
		console.log(srch);
		getData(srch).then((met) => {
		console.log(value);
		var val = makeSplitsWork(value.people[0].stats);
		console.log(val);
		var pitches;
		var pitches = document.getElementById(ha+"Pitches");//createElement("ul");
		if (isPitch) {
			pitches.innerHTML = "";
			if (val.pitchArsenal) {
			for (var i = 0; i < val.pitchArsenal.length; i++) {
				var p = document.createElement("li");
				console.log(met);
				var rpm = met.stats[0].splits.filter(e => e.stat.event && e.stat.event.details.type.code == val.pitchArsenal[i].stat.type.code)[0] || new Object();
				if (!rpm.stat) {
					rpm.stat = new Object();
					rpm.stat.metric = new Object();
					rpm.stat.metric.averageValue = "---";
				}
				p.innerText = val.pitchArsenal[i].stat.type.description + " - " + (Math.round(val.pitchArsenal[i].stat.averageSpeed*10)/10) + " MPH/"+ rpm.stat.metric.averageValue+ " RPM ("+(Math.round(val.pitchArsenal[i].stat.percentage * 1000)/10) + "%)";
				pitches.appendChild(p);
			}}
		} else {
			pitches.innerHTML = "";
		}
		//babip, k/9, p/ip, p/pa
		//var head = document.createElement("h3");
		// head.innerText = "Advanced Stats";
		statsAgainst = document.getElementById(ha+"Adv");//createElement("p");
		if (val.seasonAdvanced) {
		statsAgainst.innerHTML = (val.seasonAdvanced.pitchesPerPlateAppearance || "--");
		if (isPitch) {
			statsAgainst.innerHTML += " Pitches/BF&emsp;" + val.seasonAdvanced.strikeoutsPer9 + " K/9&emsp;";
		} else {
			statsAgainst.innerHTML+= " Pitches/PA&emsp;"
		}
		statsAgainst.innerHTML += val.seasonAdvanced.babip;
		if (!val.sabermetrics) {
			val.sabermetrics = new Object();
		}
		if (isPitch) {
			statsAgainst.innerHTML+=" BAABIP<br>"+Math.round(val.sabermetrics.eraMinus || 0)+" ERA&ndash;&emsp;"+Math.round(val.sabermetrics.fipMinus || 0) + " FIP&ndash;&emsp;";
		} else {
			statsAgainst.innerHTML+=" BABIP<br>" + Math.round(val.sabermetrics.wRcPlus || 0) + " wRC+&emsp;";
		}
		statsAgainst.innerHTML+= (Math.round((val.sabermetrics.war || 0)*100)/100)+ " WAR";
		if (!isPitch) {
			statsAgainst.innerHTML+="<br>"+(met.stats[0].splits[1].stat.metric.averageValue || "--") + "&deg; AVG Launch Angle&emsp;"+(met.stats[0].splits[0].stat.metric.averageValue || "--")+ " MPH AVG Exit Velo";
		if (game.liveData.linescore.currentInning>= 9 && !game.liveData.linescore.isTopInning && game.liveData.plays.currentPlay.runners.length > (game.liveData.linescore.teams.away.runs - game.liveData.linescore.teams.home.runs)-1) {
				statsAgainst.innerHTML+= "<br>"+(val.seasonAdvanced.walkOffs || "0") + " walk-offs";
			}
		}
		}
		else if (val.sabermetrics) {
					if (isPitch) {
			statsAgainst.innerHTML+=" BAABIP<br>"+Math.round(val.sabermetrics.eraMinus || 0)+" ERA&ndash;&emsp;"+Math.round(val.sabermetrics.fipMinus || 0) + " FIP&ndash;&emsp;";
		} else {
			statsAgainst.innerHTML+=" BABIP<br>" + Math.round(val.sabermetrics.wRcPlus || 0) + " wRC+&emsp;";
		}
		statsAgainst.innerHTML+= (Math.round((val.sabermetrics.war || 0)*100)/100)+ " WAR";
		if (!isPitch) {
			statsAgainst.innerHTML+="<br>"+(met.stats[0].splits[1].stat.metric.averageValue || "--") + "&deg; AVG Launch Angle&emsp;"+(met.stats[0].splits[0].stat.metric.averageValue || "--")+ " MPH AVG Exit Velo";
		}
		} else {
			statsAgainst.innerHTML= "No data available";
		}
		if (game.gameData.game.type == "P"|| game.gameData.game.type == "W" || game.gameData.game.type == "D" || game.gameData.game.type == "L" || game.gameData.game.type == "C") {
			console.log(pRank);
			for (var p = 0; p < pRank.leagueLeaders.length; p++) {
				var isRanked = pRank.leagueLeaders[p].leaders.filter(e => e.person.id == pitchID);
				console.log(isRanked);
				if (isRanked.length > 0) {
					document.getElementById(ha + "Adv").innerHTML+= "<br/>#"+isRanked[0].rank + " all time in postseason " + statAbbr(pRank.leagueLeaders[p].leaderCategory) + " (" + isRanked[0].value + ")";
				}
			}
		} else if (game.gameData.game.type == "R" || game.gameData.game.type == "A") {
			console.log(pRank.leagueLeaders);
			for (var p = 0; p < pRank.leagueLeaders.length; p++) {
				var isRanked = pRank.leagueLeaders[p].leaders.filter(e => e.person.id == pitchID && e.season == game.gameData.game.season);
				console.log(isRanked);
				if (isRanked.length > 0) {
					document.getElementById(ha + "Adv").innerHTML+= "<br/>#"+isRanked[0].rank + " all time in single-season " + isRanked[0].league.name + " " + statAbbr(pRank.leagueLeaders[p].leaderCategory) + " (" + isRanked[0].value + ")";
				}
			}
			if (game.gameData.game.type == "R") {
				if (!isPitch) {
					getData(baseURL+"/api/v1/stats/leaders?leaderCategories=walks,homeRuns,hits,doubles,strikeOuts,totalBases&statType=statsSingleSeason&leaderGameTypes=R&limit=10&statGroup=hitting&teamId="+game.gameData.teams[ha].id).then((tRank) => {
						for (var p = 0; p < tRank.leagueLeaders.length; p++) {
							var isRanked = tRank.leagueLeaders[p].leaders.filter(e => e.person.id == pitchID && e.season == game.gameData.game.season);
							console.log(isRanked);
							if (isRanked.length > 0) {
								document.getElementById(ha + "Adv").innerHTML+= "<br/>#"+isRanked[0].rank + " all time in single-season " + isRanked[0].team.name + " " + statAbbr(tRank.leagueLeaders[p].leaderCategory) + " (" + isRanked[0].value + ")";
							}
						}
					});
			} else {
				getData(baseURL+"/api/v1/stats/leaders?leaderCategories=strikeOuts,wins,saves,holds&statType=statsSingleSeason&leaderGameTypes=R&limit=10&statGroup=pitching&teamId="+game.gameData.teams[ha].id).then((tRank) => {
						for (var p = 0; p < tRank.leagueLeaders.length; p++) {
							var isRanked = tRank.leagueLeaders[p].leaders.filter(e => e.person.id == pitchID && e.season == game.gameData.game.season);
							console.log(isRanked);
							if (isRanked.length > 0) {
								document.getElementById(ha + "Adv").innerHTML+= "<br/>#"+isRanked[0].rank + " all time in single-season " + isRanked[0].team.name + " " + statAbbr(tRank.leagueLeaders[p].leaderCategory) + " (" + isRanked[0].value + ")";
							}
						}
					});
				}
			}
		}
		var handH = document.getElementById(ha+"VsHand");//createElement("h3");
		handH.innerText = game.liveData.plays.currentPlay.matchup.splits[split].replaceAll("_"," ");
		var hand = document.getElementById(ha+"HandStats");//createElement("p");
		if (val.statSplits.vl || val.statSplits.vr) {
		if (isPitch) {
			hand.innerHTML = val.statSplits[getMatchupData(game.liveData.plays.currentPlay.matchup.splits.pitcher)].ops + " OPS&emsp;"+val.statSplits[getMatchupData(game.liveData.plays.currentPlay.matchup.splits.pitcher)].avg + " BAA&emsp;" + val.statSplits[getMatchupData(game.liveData.plays.currentPlay.matchup.splits.pitcher)].strikeoutWalkRatio+" K:BB";
		} else {
			hand.innerHTML = val.statSplits[getMatchupData(game.liveData.plays.currentPlay.matchup.splits.batter)].avg + " AVG&emsp;"+val.statSplits[getMatchupData(game.liveData.plays.currentPlay.matchup.splits.batter)].ops + " OPS&emsp;";
			try {
				hand.innerHTML+=val.statSplitsAdvanced[getMatchupData(game.liveData.plays.currentPlay.matchup.splits.batter)].extraBaseHits;
			} catch (err) {
				hand.innerHTML+= val.statSplits[getMatchupData(game.liveData.plays.currentPlay.matchup.splits.batter)].doubles+val.statSplits[getMatchupData(game.liveData.plays.currentPlay.matchup.splits.batter)].triples+val.statSplits[getMatchupData(game.liveData.plays.currentPlay.matchup.splits.batter)].homeRuns;
				console.log(err);
			}
			hand.innerHTML+=" XBH&emsp;" + val.statSplits[getMatchupData(game.liveData.plays.currentPlay.matchup.splits.batter)].plateAppearances+" PA<br></p>";
			if (!game.liveData.plays.currentPlay.isComplete && val.statSplits["c"+game.liveData.plays.currentPlay.count.balls+game.liveData.plays.currentPlay.count.strikes]) {
				hand.innerHTML+="<p><h3>"+game.liveData.plays.currentPlay.count.balls+"-"+game.liveData.plays.currentPlay.count.strikes+" count"+"</h3>"+val.statSplits["c"+game.liveData.plays.currentPlay.count.balls+game.liveData.plays.currentPlay.count.strikes].avg + " AVG&emsp;"+val.statSplits["c"+game.liveData.plays.currentPlay.count.balls+game.liveData.plays.currentPlay.count.strikes].ops+ " OPS&emsp;";
				try {
					hand.innerHTML+= val.statSplitsAdvanced["c"+game.liveData.plays.currentPlay.count.balls+game.liveData.plays.currentPlay.count.strikes].extraBaseHits;
				} catch (err) {
					hand.innerHTML+= val.statSplits["c"+game.liveData.plays.currentPlay.count.balls+game.liveData.plays.currentPlay.count.strikes].doubles + val.statSplits["c"+game.liveData.plays.currentPlay.count.balls+game.liveData.plays.currentPlay.count.strikes].triples + val.statSplits["c"+game.liveData.plays.currentPlay.count.balls+game.liveData.plays.currentPlay.count.strikes].homeRuns;
					console.log(err);
				}
				hand.innerHTML+=" XBH&emsp;"+val.statSplits["c"+game.liveData.plays.currentPlay.count.balls+game.liveData.plays.currentPlay.count.strikes].leftOnBase+ " LOB&emsp;";
				if (game.liveData.plays.currentPlay.count.balls == 3) {
					hand.innerHTML+= val.statSplits["c"+game.liveData.plays.currentPlay.count.balls+game.liveData.plays.currentPlay.count.strikes].baseOnBalls + " BB&emsp;";
				}
				if (game.liveData.plays.currentPlay.count.strikes == 2) {
					hand.innerHTML+= val.statSplits["c"+game.liveData.plays.currentPlay.count.balls+game.liveData.plays.currentPlay.count.strikes].strikeOuts + " SO&emsp;";
				}
				hand.innerHTML+= val.statSplits["c"+game.liveData.plays.currentPlay.count.balls+game.liveData.plays.currentPlay.count.strikes].plateAppearances+ " PA";
			}
			if (loaded) {
				//avg, ops, hr, rbi, pa
				hand.innerHTML += "</p><h3>Bases Loaded</h3><p>"+val.statSplits["r123"].avg + " AVG&emsp;"+val.statSplits["r123"].ops+ " OPS&emsp;"+val.statSplits.r123.homeRuns + " HR&emsp;" + val.statSplits.r123.rbi + " RBI&emsp;"+ val.statSplits.r123.plateAppearances + " PA";
			} else if (risp2) {
				hand.innerHTML += "</p><h3>RISP, 2 out</h3><p>"+val.statSplits["risp2"].avg + " AVG&emsp;"+val.statSplits["risp2"].ops+ " OPS&emsp;"+ val.statSplitsAdvanced.risp2.extraBaseHits + " XBH&emsp;" + val.statSplits["risp2"].rbi+" RBI&emsp;" + val.statSplitsAdvanced.risp2.leftOnBase + " LOB&emsp;"+ val.statSplitsAdvanced.risp2.plateAppearances + " PA";
			} else if (r3l2) {
				hand.innerHTML += "</p><h3>with RISP</h3><p>"+val.statSplits["risp"].avg + " AVG&emsp;"+val.statSplits["risp"].ops+ " OPS&emsp;"+ val.statSplitsAdvanced.risp.extraBaseHits + " XBH&emsp;" + val.statSplits["risp"].rbi+" RBI&emsp;" + val.statSplitsAdvanced.risp.leftOnBase + " LOB&emsp;"+ val.statSplitsAdvanced.risp.plateAppearances + " PA";
			}
		}
		} else {
			hand.innerHTML= "No data available";
		}
		// var duh = document.createElement("h3");
		// duh.innerText = "DUE UP";
		if (game.gameData.status.statusCode != "O" && game.gameData.status.statusCode != "F") {
			var due = document.getElementById(ha+"Due");//createElement("span");
			due.className = "dueUp";
			var pics = [];
			due.innerHTML = "";
			for (var i = 0; i < 3; i++) {
				pics[i] = document.createElement("img");
				due.appendChild(pics[i]);
			}
			if ((isPitch && game.liveData.linescore.outs < 3 )|| (!isPitch && game.liveData.linescore.outs == 3 && (game.gameData.status.statusCode != "F" && game.gameData.status.statusCode != "O"))) {
				pics[0].src = getPhotoUrl(game.liveData.linescore.defense.batter.id);
				pics[1].src = getPhotoUrl(game.liveData.linescore.defense.onDeck.id);
				pics[2].src = getPhotoUrl(game.liveData.linescore.defense.inHole.id);
			}  else if (isPitch && game.liveData.linescore.outs == 3) {
				pics[0].src = getPhotoUrl(game.liveData.linescore.offense.batter.id);
				pics[1].src = getPhotoUrl(game.liveData.linescore.offense.onDeck.id);
				pics[2].src = getPhotoUrl(game.liveData.linescore.offense.inHole.id);
			}
			else {
				pics[0].src="";
				pics[1].src = getPhotoUrl(game.liveData.linescore.offense.onDeck.id);
				pics[2].src = getPhotoUrl(game.liveData.linescore.offense.inHole.id);
			}
		} else {
			document.getElementById(ha+"Duh").innerText = "";
			document.getElementById(ha+"Due").innerHTML="";
		}
		var bph = document.getElementById(ha+"BenchPen");//createElement("h3");
		if (isPitch) {
			bph.innerText = "IN BULLPEN";
		} else {
			bph.innerText = "ON BENCH";
		}
		var bPics = [];
		var bPen = document.getElementById(ha+"Pen");//createElement("span");
		bPen.innerHTML = "";
		// bPen.className = "bullpen"
		if (isPitch) {
			for (var i = 0; i < game.liveData.boxscore.teams[ha].bullpen.length; i++) {
				bPics[i] = document.createElement("img");
				bPics[i].src = getPhotoUrl(game.liveData.boxscore.teams[ha].bullpen[i]);
				bPen.appendChild(bPics[i]);
			}
		} else {
				for (var i = 0; i < game.liveData.boxscore.teams[ha].bench.length; i++) {
				bPics[i] = document.createElement("img");
				bPics[i].src = getPhotoUrl(game.liveData.boxscore.teams[ha].bench[i]);
				bPen.appendChild(bPics[i]);
			}
		}
		//div.append(top,img,summ,pitches,head,statsAgainst,handH,hand,duh,due,bph,bPen);
		//document.getElementById(ha).innerHTML = "";
		//document.getElementById(ha).appendChild(div);
	});});});
	if (!historicGame) {
		getData(baseURL + "/api/v1/game/"+game.gamePk+"/contextMetrics").then((valCM) => {
		console.log(valCM);
		for (var i = 0; i < 2; i++) {
			var wProbText = game.gameData.teams[twos[i]].abbreviation +  " Win&nbsp;Probability:&nbsp;"+(Math.round(valCM[twos[i]+"WinProbability"]*10)/10)+"%";
			document.getElementById(twos[i]+"WPSpan").style.width = valCM[twos[i]+"WinProbability"] + "%";
			document.getElementById(twos[i]+"WP").innerText = "";
			// document.getElementById(twos[i]+"WPSpan").innerText = "";
				// document.getElementById(twos[i]+"WPImg").src="";
				wP = document.getElementById(twos[i]+"WP");//createElement("span");
				// wP.className = 'winProb';
				wP.innerHTML = wProbText;
				// top.before(wP);
				//document.getElementById(twos[i]+"WPSpan").value=valCM.awayWinProbability;
			if (valCM[twos[i] + "WinProbability"] <= 2) {
				// document.getElementById(twos[i]+"WPSpan").innerHTML = wProbText;
				document.getElementById(twos[i]+"WPImg").style.opacity = "0";
				document.getElementById(twos[i]+"WPImg").style.width = "0";
			} else {
				document.getElementById(twos[i]+"WPImg").style.opacity = "1";
				document.getElementById(twos[i]+"WPImg").style.width = "3dvh";
			}
		}
	});
	} else {
		getData(baseURL + "/api/v1/game/"+game.gamePk+"/winProbability").then((winArray) => {
		// console.log(valCM);
		var valCM;
		try {
			valCM =  winArray.filter(e => e.atBatIndex == game.liveData.plays.currentPlay.atBatIndex-1)[0];
		} catch (err) {
			valCM = new Object();
			valCM.homeTeamWinProbability = 50;
			valCM.awayTeamWinProbability = 50;
		}
		for (var i = 0; i < 2; i++) {
			var wProbText = game.gameData.teams[twos[i]].abbreviation +  " Win&nbsp;Probability:&nbsp;"+(Math.round(valCM[twos[i]+"TeamWinProbability"]*10)/10)+"%";
			document.getElementById(twos[i]+"WPSpan").style.width = valCM[twos[i]+"TeamWinProbability"] + "%";
			document.getElementById(twos[i]+"WP").innerText = "";
			// document.getElementById(twos[i]+"WPSpan").innerText = "";
				// document.getElementById(twos[i]+"WPImg").src="";
				wP = document.getElementById(twos[i]+"WP");//createElement("span");
				// wP.className = 'winProb';
				wP.innerHTML = wProbText;
				// top.before(wP);
				//document.getElementById(twos[i]+"WPSpan").value=valCM.awayWinProbability;
			if (valCM[twos[i] + "TeamWinProbability"] <= 2) {
				// document.getElementById(twos[i]+"WPSpan").innerHTML = wProbText;
				document.getElementById(twos[i]+"WPImg").style.opacity = "0";
				document.getElementById(twos[i]+"WPImg").style.width = "0";
			} else {
				document.getElementById(twos[i]+"WPImg").style.opacity = "1";
				document.getElementById(twos[i]+"WPImg").style.width = "3dvh";
			}
		}
	});
	}
	
	document.getElementById("scores").style.display = "none";
	document.getElementById("game").style.display="block";
}
function getMatchupData(match) {
	if (match.includes("RH")) {
		return "vr";
	} else {
		return "vl";
	}
}
function makeSplitsWork(data) {
	ret = new Object();
	for (var i = 0; i < data.length; i++) {
		if (data[i].type.displayName != "pitchArsenal" && data[i].type.displayName != "statSplits" && data[i].type.displayName != "statSplitsAdvanced") {
			ret[data[i].type.displayName] = data[i].splits[0].stat;
		} else if (data[i].type.displayName == "pitchArsenal") {
			ret[data[i].type.displayName] = data[i].splits;
		} else if (data[i].type.displayName == "statSplits" || data[i].type.displayName == "statSplitsAdvanced") {
			ret[data[i].type.displayName] = new Object();
			for (var j = 0; j < data[i].splits.length; j++) {
				ret[data[i].type.displayName][data[i].splits[j].split.code] = data[i].splits[j].stat;
			}
		}
	}
	return ret;
}
function getPhotoUrl(id) {
	return "https://midfield.mlbstatic.com/v1/people/"+id+"/silo/360";
}
function getGameTime(dt) {
	var gTime = dt.substring(11).split(":");
	gTime[0] = (parseInt(gTime[0]) - timeOffset);
	if (gTime[0] < 0) {
		gTime[0] += 24;
	}
	if (gTime[0] < 12) {
		gTime[2] = " AM";
	} else {
		gTime[2] = " PM";
	}
	return ((gTime[0] % 12) || 12) + ":" + gTime[1] + gTime[2];
}
async function getData(url) {
	var ret;
	var jso = await fetch(url);
	ret = await jso.json();
	return ret;
}

function abbrFromId(id) {
	if (id == 133) {
		return "OAK";
	} else if (id == 134) {
		return "PIT";
	} else if (id == 135) {
		return "SD";
	} else if (id == 136) {
		return "SEA";
	} else if (id == 137) {
		return "SF";
	} else if (id == 138) {
		return "STL";
	} else if (id == 139) {
		return "TB";
	} else if (id == 140) {
		return "TEX";
	} else if (id == 141) {
		return "TOR";
	} else if (id == 142) {
		return "MIN";
	} else if (id == 143) {
		return "PHI";
	} else if (id == 144) {
		return "ATL";
	} else if (id == 145) {
		return "CWS";
	} else if (id == 146) {
		return "MIA";
	} else if (id == 147) {
		return "NYY";
	} else if (id == 158) {
		return "MIL";
	} else if (id == 108) {
		return "LAA";
	} else if (id == 109) {
		return "ARI";
	} else if (id == 110) {
		return "BAL";
	} else if (id == 111) {
		return "BOS";
	} else if (id == 112) {
		return "CHC";
	} else if (id == 113) {
		return "CIN";
	} else if (id == 114) {
		return "CLE";
	} else if (id == 115) {
		return "COL";
	} else if (id == 116) {
		return "DET";
	} else if (id == 117) {
		return "HOU";
	} else if (id == 118) {
		return "KC";
	} else if (id == 119) {
		return "LAD";
	} else if (id == 120) {
		return "WAS";
	} else if (id == 121) {
		return "NYM";
	}
}
function hideModal(code) {
	document.getElementById("popUp").style.display = "none";
	hideCode = code;
}
function splitInHalf(string) {
	var spl = [];
	spl.push(string.substring(0,Math.round(string.length/2)));
	spl.push(string.substring(Math.round(string.length/2)));
	return spl;
}
function delayTime() {
	document.getElementById("delaySec").innerText = document.getElementById("offset").value + "s";
}
function showSett() {
	document.getElementById("sett").style.display = "block";
}
function closeSett() {
	document.getElementById("sett").style.display = "none";
}
function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function statAbbr(statId) {
	if (statId == "homeRuns") {
		return "HR";
	} else if (statId == "doubles") {
		return "2B";
	} else if (statId == "triples") {
		return "3B";
	} else if (statId == "runsBattedIn") {
		return "RBI";
	}
	else if	(statId == "onBasePlusSlugging") {
		return "OPS";
	}
	else if	(statId == "onBasePercentage") {
		return "OBP";
	} else if	(statId == "battingAverage") {
		return "AVG";
	} else if	(statId == "strikeOuts") {
		return "strikeouts";
	} else if	(statId == "totalBases") {
		return "total bases";
	} else if	(statId == "sluggingPercentage") {
		return "SLG";
	} else if	(statId == "baseOnBalls") {
		return "walks";
	}   else {
		return statId;
	}
}
function timeDiff(t1,t2) {
	return new Date(mlbTimeConv(t2)) - new Date(mlbTimeConv(t1));
}
function mlbTimeConv(time) {
	return "" + time.substring(0,4)+"-"+time.substring(4,6)+"-"+time.substring(6,8)+"T"+time.substring(9,11)+":"+time.substring(11,13)+":"+time.substring(13);
}