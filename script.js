const baseURL = "https://statsapi.mlb.com";
var vars;
var uRL;
window.onload = function() {
	getData(baseURL + "/api/v1/schedule?sportId=1").then((value) => {
		console.log(value);
		g = value.dates[0].games.filter(e => e.status.statusCode == "I");
		tab = document.createElement("table");
		for (var i = 0; i < g.length/3; i++) {
			row = document.createElement("tr");
			for (var j = i * 3; j < i*3+3 && j < g.length; j++) {
				game = document.createElement("td");
				game.innerText = g[j].teams.away.team.name + " " + g[j].teams.away.score + " @ " + g[j].teams.home.team.name + " " + g[j].teams.home.score;
				game.setAttribute("onclick","runGD(\""+baseURL+g[j].link+"\")");
				row.appendChild(game);
			}
			tab.appendChild(row);
		}
		document.getElementById("scores").appendChild(tab);
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
function runGD(url) {
	uRL = url;
	gameDay();
	run = setInterval(gameDay,10000);
}
function pitchDisplay(game,ha) {
	// vars = game;
	var isPitch = game.liveData.linescore.isTopInning == (ha == "home");
	console.log(ha);
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
	//img.className = "featured";
	var summ = document.getElementById(ha+"Summ");//createElement("p");
	if (game.liveData.linescore.isTopInning == (ha == "home")) {
		summ.innerText = game.liveData.boxscore.teams[ha].players["ID"+pitchID].stats.pitching.summary + ", " + (game.liveData.boxscore.teams[ha].players["ID"+pitchID].stats.pitching.pitchesThrown || "0") + " pitches ("  +game.liveData.boxscore.teams[ha].players["ID"+pitchID].stats.pitching.strikes + " strikes)";
	} else {
		summ.innerText = game.liveData.boxscore.teams[ha].players["ID"+pitchID].stats.batting.summary;
	}
	var search = baseURL;
	if (isPitch) {
		search = baseURL + "/api/v1/people/"+ pitchID + "?hydrate=stats(group=pitching,type=[seasonAdvanced,pitchArsenal,sabermetrics,statSplits,statSplitsAdvanced],sitCodes="+getMatchupData(game.liveData.plays.currentPlay.matchup.splits.pitcher)+")"
	} else {
		search = baseURL + "/api/v1/people/"+pitchID+"?hydrate=stats(group=hitting,type=[seasonAdvanced,statSplits,sabermetrics,statSplitsAdvanced],sitCodes=["+getMatchupData(game.liveData.plays.currentPlay.matchup.splits.batter)+",c"+game.liveData.plays.currentPlay.count.balls + game.liveData.plays.currentPlay.count.strikes+"])";
	}
	// var wP;
	getData(search).then((value) => {
		console.log(value);
		var val = makeSplitsWork(value.people[0].stats);
		console.log(val);
		var pitches;
		var pitches = document.getElementById(ha+"Pitches");//createElement("ul");
		if (isPitch) {
			pitches.innerHTML = "";
			for (var i = 0; i < val.pitchArsenal.length; i++) {
			var p = document.createElement("li");
			p.innerText = val.pitchArsenal[i].stat.type.description + " - " + (Math.round(val.pitchArsenal[i].stat.averageSpeed*10)/10) + " MPH ("+(Math.round(val.pitchArsenal[i].stat.percentage * 100)) + "%)";
			pitches.appendChild(p);
		}
		} else {
			pitches.after(document.createElement("br"));
		}
		//babip, k/9, p/ip, p/pa
		//var head = document.createElement("h3");
		// head.innerText = "Advanced Stats";
		statsAgainst = document.getElementById(ha+"Adv");//createElement("p");
		statsAgainst.innerHTML = val.seasonAdvanced.pitchesPerPlateAppearance;
		if (isPitch) {
			statsAgainst.innerHTML += " Pitches/BF&emsp;" + val.seasonAdvanced.strikeoutsPer9 + " K/9&emsp;";
		} else {
			statsAgainst.innerHTML+= " Pitches/PA&emsp;"
		}
		statsAgainst.innerHTML += val.seasonAdvanced.babip;
		if (isPitch) {
			statsAgainst.innerHTML+=" BAABIP<br>"+Math.round(val.sabermetrics.eraMinus)+" ERA&ndash;&emsp;";
		} else {
			statsAgainst.innerHTML+=" BABIP<br>" + Math.round(val.sabermetrics.wRcPlus) + " wRC+&emsp;";
		}
		statsAgainst.innerHTML+= (Math.round(val.sabermetrics.war*100)/100)+ " WAR";
		var handH = document.getElementById(ha+"VsHand");//createElement("h3");
		handH.innerText = game.liveData.plays.currentPlay.matchup.splits[split].replaceAll("_"," ");
		var hand = document.getElementById(ha+"HandStats");//createElement("p");
		if (isPitch) {
			hand.innerHTML = val.statSplits[getMatchupData(game.liveData.plays.currentPlay.matchup.splits.pitcher)].ops + " OPS&emsp;"+val.statSplits[getMatchupData(game.liveData.plays.currentPlay.matchup.splits.pitcher)].avg + " BAA&emsp;" + val.statSplits[getMatchupData(game.liveData.plays.currentPlay.matchup.splits.pitcher)].strikeoutWalkRatio+" K:BB";
		} else {
			hand.innerHTML = val.statSplits[getMatchupData(game.liveData.plays.currentPlay.matchup.splits.batter)].avg + " AVG&emsp;"+val.statSplits[getMatchupData(game.liveData.plays.currentPlay.matchup.splits.batter)].ops + " OPS&emsp;"+val.statSplitsAdvanced[getMatchupData(game.liveData.plays.currentPlay.matchup.splits.batter)].extraBaseHits+" XBH&emsp;" + val.statSplits[getMatchupData(game.liveData.plays.currentPlay.matchup.splits.batter)].plateAppearances+" PA<br></p>";
			if (!game.liveData.plays.currentPlay.isComplete && val.statSplits["c"+game.liveData.plays.currentPlay.count.balls+game.liveData.plays.currentPlay.count.strikes]) {
				hand.innerHTML+="<p><h3>"+game.liveData.plays.currentPlay.count.balls+"-"+game.liveData.plays.currentPlay.count.strikes+" count"+"</h3>"+val.statSplits["c"+game.liveData.plays.currentPlay.count.balls+game.liveData.plays.currentPlay.count.strikes].avg + " AVG&emsp;"+val.statSplits["c"+game.liveData.plays.currentPlay.count.balls+game.liveData.plays.currentPlay.count.strikes].ops+ " OPS&emsp;"+val.statSplitsAdvanced["c"+game.liveData.plays.currentPlay.count.balls+game.liveData.plays.currentPlay.count.strikes].extraBaseHits+ " XBH&emsp;"+val.statSplits["c"+game.liveData.plays.currentPlay.count.balls+game.liveData.plays.currentPlay.count.strikes].leftOnBase+ " LOB&emsp;" + val.statSplits["c"+game.liveData.plays.currentPlay.count.balls+game.liveData.plays.currentPlay.count.strikes].plateAppearances+ " PA";
			}
			if (game.liveData.linescore.currentInning>= 9 && !game.liveData.linescore.isTopInning) {
				hand.innerHTML+= "<br>"+val.seasonAdvanced.walkOffs+ " walk-offs";
			}
		}
		// var duh = document.createElement("h3");
		// duh.innerText = "DUE UP";
		var due = document.getElementById(ha+"Due");//createElement("span");
		due.className = "dueUp";
		var pics = [];
		due.innerHTML = "";
		for (var i = 0; i < 3; i++) {
			pics[i] = document.createElement("img");
			due.appendChild(pics[i]);
		}
		if (isPitch) {
			pics[0].src = getPhotoUrl(game.liveData.linescore.defense.batter.id);
			pics[1].src = getPhotoUrl(game.liveData.linescore.defense.onDeck.id);
			pics[2].src = getPhotoUrl(game.liveData.linescore.defense.inHole.id);
		} else {
			pics[1].src = getPhotoUrl(game.liveData.linescore.offense.onDeck.id);
			pics[2].src = getPhotoUrl(game.liveData.linescore.offense.inHole.id);
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
		getData(baseURL + "/api/v1/game/"+game.gamePk+"/contextMetrics").then((valCM) => {
			console.log(valCM);
			//if (valCM[ha + "WinProbability"] >= 50) {
				wP = document.getElementById(ha+"WP");//createElement("span");
				// wP.className = 'winProb';
				wP.innerHTML = "Win&nbsp;Probability:&nbsp;"+(Math.round(valCM[ha+"WinProbability"]*10)/10)+"%";
				top.after(wP);
			//}
		});
	});
	
	
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
async function getData(url) {
	var ret;
	var jso = await fetch(url);
	ret = await jso.json();
	return ret;
}