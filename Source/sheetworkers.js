const sheetVersion = "0.1";
const sheetName = "Moon Punk";
const getTranslation = (key) => (getTranslationByKey(key) || "NO_TRANSLATION_FOUND");

//Translate all of the data
data.leveling.advanced_advancements.forEach(item => {
	item.name = getTranslation(item.name);
});
data.leveling.basic_advancements.forEach(item => {
	item.name = getTranslation(item.name);
});


Object.keys(data.playbooks).forEach(playbook =>{

	//translate the gear
	data.playbooks[playbook].gear.forEach(item => {
		item.name = getTranslation(item.name);
	});

	//translate links to toher characters
	data.playbooks[playbook].links.forEach(item => {
		item.name = getTranslation(item.name);
	});

	//translate moves
	data.playbooks[playbook].moves.forEach(item => {
		item.description = getTranslation(item.name+'_description');
		item.name = getTranslation(item.name);
	});

	//translate specialties
	data.playbooks[playbook].specialties.forEach(item => {
		item.description = getTranslation(item.name+'_description');
		item.name = getTranslation(item.name);
	});

	//translate stattext
	data.playbooks[playbook].stats.forEach(item => {
		item.name = getTranslation(item.name);
	});

});

/* Utility functions - shouldn't need to touch most of these */
//Completely lifted from joesinghaus
//There are probably many that I don't need ¯\_(ツ)_/¯

const mySetAttrs = (attrs, options, callback) => {
	const finalAttrs = Object.keys(attrs).reduce((m, k) => {
		m[k] = String(attrs[k]);
		return m;
	}, {});
	console.log(finalAttrs);
	setAttrs(finalAttrs, options, callback);
},

setAttr = (name, value) => {
	getAttrs([name], v => {
		const setting = {};
		if (v[name] !== String(value)) setting[name] = String(value);
		setAttrs(setting);
	});
},

fillRepeatingSectionFromData = (sectionName, dataList, autogen, callback) => {
	callback = callback || (() => {});
	getSectionIDs(`repeating_${sectionName}`, idList => {
		const existingRowAttributes = [
			...idList.map(id => `repeating_${sectionName}_${id}_name`),
			...idList.map(id => `repeating_${sectionName}_${id}_autogen`)
		];
		getAttrs(existingRowAttributes, v => {
			/* Delete auto-generated rows */
			if (autogen) {
				idList = idList.filter(id => {
					if (v[`repeating_${sectionName}_${id}_autogen`]) {
						removeRepeatingRow(`repeating_${sectionName}_${id}`);
						return false;
					}
					else return true;
				});
			}
			const existingRowNames = idList.map(id => v[`repeating_${sectionName}_${id}_name`]),
				createdIDs = [],
				setting = dataList.filter(o => !existingRowNames.includes(o.name))
					.map(o => {
						let rowID;
						while (!rowID) {
							let newID = generateRowID();
							if (!createdIDs.includes(newID)) {
								rowID = newID;
								createdIDs.push(rowID);
							}
						}
						const newAttrs = {};
						if (autogen) {
							newAttrs[`repeating_${sectionName}_${rowID}_autogen`] = "1";
						}
						return Object.keys(o).reduce((m, key) => {
							m[`repeating_${sectionName}_${rowID}_${key}`] = o[key];
							return m;
						}, newAttrs);
					})
					.reduce((m, o) => Object.assign(m, o), {});
			mySetAttrs(setting, {}, callback);
		});
	});
},

diceMagic = num => {
	const range = end => [...Array(end + 1).keys()].slice(1);
	if (num > 0) return `dice=${range(num).map(() => "[[d6]]").join("&"+"#44"+"; ")}`;
	else return "zerodice=[[d6]]&"+"#44"+"; [[d6]]";
},
buildRollFormula = base => {
	return ` {{?{@{bonusdice}|${
		[0, 1, 2, 3, 4, 5, 6, -1, -2, -3].map(n => `${n},${diceMagic(n + (parseInt(base) || 0))}`).join("|")
	}}}}`;
},
buildNumdiceFormula = () => {
	return ` {{?{${getTranslation("numberofdice")}|${
		[0, 1, 2, 3, 4, 5, 6].map(n => `${n},${diceMagic(n)}`).join("|")
	}}}}`;
},
emptyFirstRowIfUnnamed = sectionName => {
	getSectionIDs(`repeating_${sectionName}`, idList => {
		const id = idList[0];
		getAttrs([`repeating_${sectionName}_${id}_name`], v => {
			if (!v[`repeating_${sectionName}_${id}_name`]) {
				removeRepeatingRow(`repeating_${sectionName}_${id}`);
			}
		});
	});
},
handleBoxesFill = (name, upToFour) => {
	on(`change:${name}1 change:${name}2 change:${name}3 change:${name}4`, event => {
		if (event.sourceType !== "player") return;
		getAttrs([event.sourceAttribute], v => {
			const rName = event.sourceAttribute.slice(0, -1),
				setting = {};
			if (String(v[event.sourceAttribute]) === "1") {
				switch (event.sourceAttribute.slice(-1)) {
				case "4":
					setting[`${rName}3`] = 1;
					/* falls through */
				case "3":
					setting[`${rName}2`] = 1;
					/* falls through */
				case "2":
					setting[`${rName}1`] = 1;
				}
			}
			if (String(v[event.sourceAttribute]) === "0") {
				switch (event.sourceAttribute.slice(-1)) {
				case "1":
					setting[`${rName}2`] = 0;
					/* falls through */
				case "2":
					setting[`${rName}3`] = 0;
					/* falls through */
				case "3":
					if (upToFour) setting[`${rName}4`] = 0;
				}
			}
			mySetAttrs(setting);
		});
	});
};

on("change:playbook", event => {

	getAttrs(["playbook", "change_attributes"], v => {
		console.log(v.playbook);

		fillRepeatingSectionFromData("gear",data.playbooks[v.playbook].gear, true);
		fillRepeatingSectionFromData("moves",data.playbooks[v.playbook].moves, true);
		fillRepeatingSectionFromData("specialties",data.playbooks[v.playbook].specialties, true);
		fillRepeatingSectionFromData("links",data.playbooks[v.playbook].links, true);
		fillRepeatingSectionFromData("leveling",[].concat(data.leveling.basic_advancements,data.leveling.advanced_advancements), true);
		fillRepeatingSectionFromData("stats", data.playbooks[v.playbook].stats, true);


	});

	setAttr("cool", 0);
	setAttr("smarts", 0);
	setAttr("bones", 0);
	setAttr("presence", 0);
	setAttr("chosestats", 0);

});

on('clicked:resetstats', function() {
	setAttr("cool", 0);
	setAttr("smarts", 0);
	setAttr("bones", 0);
	setAttr("presence", 0);
	setAttr("chosestats", 0);
});

on('clicked:repeating_stats', function(eventInfo) {
	console.log(eventInfo);

	const trigger = eventInfo.sourceAttribute.split('_');
    const rowid = trigger[2];
	
	console.log(rowid);

	getAttrs(["repeating_stats_" + rowid + "_name",
	 "repeating_stats_" + rowid + "_cool",
	 "repeating_stats_" + rowid + "_smarts",
	 "repeating_stats_" + rowid + "_bones",
	 "repeating_stats_" + rowid + "_presence",], s => {

		Object.keys(s).forEach(key => {

			if(key.includes("cool")){
				setAttr("cool", s[key]);
			}
			if(key.includes("smarts")){
				setAttr("smarts", s[key]);
			}
			if(key.includes("bones")){
				setAttr("bones", s[key]);
			}
			if(key.includes("presence")){
				setAttr("presence", s[key]);
			}

		});

	});

	setAttr("chosestats", 1);



});