	var reader; //GLOBAL File Reader object

    /**
     * Check for the various File API support.
     */
    function checkFileAPI() {
        if (window.File && window.FileReader && window.FileList && window.Blob) {
            reader = new FileReader();
            return true; 
        } else {
            alert('The File APIs are not fully supported by your browser. Fallback required.');
            return false;
        }
    }

    /**
     * read text input
     */
    function readText(filePath) {
        var output = ""; //placeholder for text output
        if(filePath.files && filePath.files[0]) {           
            reader.onload = function (e) {
                output = e.target.result;
				preliminaryValidation(output);
				processAndFormat(output);
                //displayContents(output);
            };//end onload()
            reader.readAsText(filePath.files[0]);
        }//end if html5 filelist support
        else if(ActiveXObject && filePath) { //fallback to IE 6-8 support via ActiveX
            try {
                reader = new ActiveXObject("Scripting.FileSystemObject");
                var file = reader.OpenTextFile(filePath, 1); //ActiveX File Object
                output = file.ReadAll(); //text contents of file
                file.Close(); //close file "input stream"
                displayContents(output);
            } catch (e) {
                if (e.number == -2146827859) {
                    alert('Unable to access local files due to browser security settings. ' + 
                     'To overcome this, go to Tools->Internet Options->Security->Custom Level. ' + 
                     'Find the setting for "Initialize and script ActiveX controls not marked as safe" and change it to "Enable" or "Prompt"'); 
                }
            }       
        }
        else { //this is where you could fallback to Java Applet, Flash or similar
            return false;
        }       
        return true;
    }   

    /**
     * display content using a basic HTML replacement
     */
    function displayContents(txt) {
        var el = document.getElementById('fileOutput'); 
        el.innerHTML = txt; //display output in DOM
		finalValidation();
    }   
	
	function processAndFormat(txt) {
		var fileLines = txt.split("\n");
		var output = [];
		fileLines.forEach(function (element, index) {
			firstChar = element.substring(0,1);
			switch(firstChar) {
				case "1": //File Header
					output[index] = "<h2>FILE HEADER</h2><table><tr><th> Immediate Destination </th><th> Immediate Origin </th><th> File Creation Date </th><th> File Creation Time </th>"
					+ "<th> Immediate Destination Name </th><th> Immediate Origin Name </th></tr><tr><td> " + element.substring(3,13) + " </td><td> " + element.substring(13,23) + " </td><td> " 
					+ formatDate(element.substring(23,29)) + " </td><td> " + element.substring(29,31) + ":" + element.substring(31,33) + " </td><td> " + element.substring(40,63) + " </td><td> " + element.substring(63,86) + "</tr></table>";
					break;
				case "5": //Batch Header
					batchNumber = Number(element.substring(87,94));
					output[index] = "<h2>BATCH HEADER</h2><table><tr><th>Company Name </th><th> Company Discretionary Data </th><th> Company Identification </th><th>" 
					+ "Standard Entry Class </th><th> Company Entry Description </th><th> Company Descriptive Date </th><th> Effective Entry Date </th><th> Batch Number </th></tr>" +
					" <tr class='batchHeader " + batchNumber + "'><td> " + element.substring(4,20) + " </td><td> " + element.substring(20,40) + " </td><td> " + element.substring(40,50) +
					" </td><td> " + element.substring(50,53) + " </td><td> " + element.substring(53,63) + " </td><td> " + element.substring(63,69) +
					" </td><td title='" + element.substring(69,75) + "' class='entryEffectiveDate'> " + formatDate(element.substring(69,75)) + " </td><td> " + element.substring(87,94) + "</td></tr></table><h2>ENTRY DETAIL RECORDS</h2><table><tr><th>Tran Code </th><th> RDFI Identification</th><th>"+
					" RDFI Account Number </th><th> Amount </th><th> Individual ID </th><th> Individual Name </th></tr>";
					
					break;
				case "6": //Entry Detail
					output[index] = "<tr" + getTranCodeDescription(element.substring(1,3), batchNumber) + "</td><td class='routingNumber'>" + element.substring(3,12) + "</td><td>" + element.substring(12,29) +
					"</td><td class='dollarAmount entryAmount'>$" + numberWithCommas((Number(element.substring(29,39))/100).toFixed(2)) + "</td><td>" + element.substring(39,54) + "</td><td>" + element.substring(54,76) + "</td></tr>";
					break;
				case "8": //Batch Control
					output[index] = "</table><h2>BATCH CONTOL</h2><table><tr><th>Entry/Addenda Count</th><th>Entry Hash</th><th>Total Debit Entry Amount</th><th>Total Credit Entry Amount</th><th>Company Identification" 
					+ "</th></tr><tr class='" + batchNumber + "'><td class='batchEntryCount'>" + element.substring(4,10) + "</td><td class='batchEntryHash'>" + element.substring(10,20) + "</td><td class='dollarAmount batchDebitAmount'>$" + numberWithCommas((Number(element.substring(20,32))/100).toFixed(2)) + "</td><td class='dollarAmount batchCreditAmount'>$" 
					+ numberWithCommas((Number(element.substring(32,44))/100).toFixed(2)) + "</td><td>" + element.substring(44,54) + "</td></tr></table>";
					break;
				case "9": //Unclear
					secondChar = element.substring(1,2);
					switch(secondChar) {
						case "0": //File Control
							output[index] = "<h2>FILE CONTROL</h2><table><tr><th>Batch Count</th><th>Entry/Addenda Count</th><th>Entry Hash</th><th>Total Debit Entry Amount</th><th>Total Credit Entry Amount" 
							+ "</th></tr><tr><td id='fileBatchCount'>" + element.substring(1,7) + "</td><td id='fileEntryCount'>" + element.substring(13,21) + "</td><td id='fileEntryHash'>" + element.substring(21,31) + "</td><td class='dollarAmount' id='fileDebitAmount'>$" 
								+ numberWithCommas((Number(element.substring(31, 43)) / 100).toFixed(2)) + "</td><td class='dollarAmount'id='fileCreditAmount'>$" + numberWithCommas((Number(element.substring(43,55))/100).toFixed(2)) + "</td></tr></table>";
							break;
						case "9": //Filler
							break;
					}
					break;
			}
		})
		var outputString = output.join("");
		displayContents(outputString);
	}
	
	function getTranCodeDescription(tranCode, batchNumber) {
		switch(tranCode) {
			case "21": //Return or NOC
				description = " class='credit " + batchNumber + "'><td>21 - DDA CR Return/NOC";
				break;
			case "22":
				description = " class='credit " + batchNumber + "'><td>22 - DDA Credit";
				break;
			case "23":
				description = " class='credit " + batchNumber + "'><td>23 - DDA Credit Prenote";
				break;
			case "26":
				description = " class='debit " + batchNumber + "'><td>26 - DDA DR Return/NOC";
				break;
			case "27":
				description = " class='debit " + batchNumber + "'><td>27 - DDA Debit";
				break;
			case "28":
				description = " class='debit " + batchNumber + "'><td>28 - DDA Debit Prenote";
				break;
			case "31":
				description = " class='credit " + batchNumber + "'><td>31 - SAV CR Return/NOC";
				break;
			case "32":
				description = " class='credit " + batchNumber + "'><td>32 - SAV Credit";
				break;
			case "33":
				description = " class='credit " + batchNumber + "'><td>33 - SAV Credit Prenote";
				break;
			case "36":
				description = " class='debit " + batchNumber + "'><td>36 - SAV DR Return/NOC";
				break;
			case "37":
				description = " class='debit " + batchNumber + "'><td>37 - SAV Debit";
				break;
			case "38":
				description = " class='debit " + batchNumber + "'><td>38 - SAV Debit Prenote";
				break;
			case "41":
				description = " class='credit " + batchNumber + "'><td>41 - GL CR Return/NOC";
				break;
			case "42":
				description = " class='credit " + batchNumber + "'><td>42 - GL Credit";
				break;
			case "43":
				description = " class='credit " + batchNumber + "'><td>43 - GL Credit Prenote";
				break;
			case "46":
				description = " class='debit " + batchNumber + "'><td>46 - GL DR Return/NOC";
				break;
			case "47":
				description = " class='debit " + batchNumber + "'><td>47 - GL Debit";
				break;
			case "48":
				description = " class='debit " + batchNumber + "'><td>48 - GL Debit Prenote";
				break;
			case "51":
				description = " class='credit " + batchNumber + "'><td>51 - LAS CR Return/NOC";
				break;
			case "52":
				description = " class='credit " + batchNumber + "'><td>52 - LAS Credit";
				break;
			case "53":
				description = " class='credit " + batchNumber + "'><td>53 - LAS Credit Prenote";
				break;
			case "56":
				description = " class='debit " + batchNumber + "'><td>56 - LAS DR Return/NOC";
				break;
			case "57":
				description = " class='debit " + batchNumber + "'><td>57 - LAS Debit";
				break;
			case "58":
				description = " class='debit " + batchNumber + "'><td>58 - LAS Debit Prenote";
				break;
			default:
				description = tranCode;
		}
		return description;
	}
	
	function numberWithCommas(x) {
		return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}
	
	function formatDate(inputDate) {
		inputDate = "20" + inputDate;
		year = inputDate.substring(0,4);
		month = inputDate.substring(4,6);
		day = inputDate.substring(6,8);
		return month + "/" + day + "/" + year;
	}
	//////////////////////////////////////THIS/////////////////////////////////////////////////////////////////
	function finalValidation() {  
		validateBatchRoutingNumberHash(); 
		validateBatchEntryCount();
		validateEntryEffectiveDate();
		validateFileBatchCount();
		validateFileEntryCount();
		validateFileRoutingNumberHash();
		validateBatchDebitAmount();
		validateBatchCreditAmount();
		validateFileDebitAmount();
		validateFileCreditAmount();
	}
	////////////////////////////////////END///////////////////////////////////////////////////////////////////////
	function validateBatchRoutingNumberHash() { 
		var routingNumbersToHash = document.getElementsByClassName("routingNumber");
		var numberOfEntries = routingNumbersToHash.length;
		var lastEntry = numberOfEntries - 1;
		//alert(routingNumbersToHash[lastEntry].parent.innerHTML);
		var numberOfBatches = getBatchNumber(routingNumbersToHash[lastEntry]);

		var count = 0;
		for(batch=1; batch <= numberOfBatches; batch++) {
			count = 0;
			for(var i=0; i < routingNumbersToHash.length; i++) { 
				currentEntryBatchNumber = getBatchNumber(routingNumbersToHash[i]);
				if(currentEntryBatchNumber===batch) {
					count += Number((routingNumbersToHash[i].innerHTML).substring(0,8)); 
				}
			}
			var batchEntryHashes = document.getElementsByClassName("batchEntryHash");
			for(hash = 0; hash < batchEntryHashes.length; hash++) {
				if(getBatchNumber(batchEntryHashes[hash])===batch) {
					var thisBatchEntryHash = batchEntryHashes[hash];
					var hashToCompare = Number(thisBatchEntryHash.innerHTML);
					if(hashToCompare.length > 10) {
						hashToCompare = hashToCompare.substr(hashToCompare.length - 10);
					}
					if(count.length > 10) {
						count = count.substr(count.length - 10);
					}
					if(count === hashToCompare) {
						thisBatchEntryHash.style.backgroundColor = "#00FF00";
					} else {
						thisBatchEntryHash.style.backgroundColor = "#FF0000";
						alert("Batch Entry Hash for batch " + batch + " does NOT equal the total routing number hash.  This file cannot be processed as is.");
					}
				}
			}
		}
		
	}
	
	function validateBatchEntryCount() {
		
		var entriesToSum = document.getElementsByClassName("routingNumber");
		var numberOfEntries = entriesToSum.length;
		var lastEntry = numberOfEntries - 1;
		var numberOfBatches = getBatchNumber(entriesToSum[lastEntry]);
		var batchEntryCounts = document.getElementsByClassName("batchEntryCount");
		
		for(batch=1; batch <= numberOfBatches; batch++) {
			var count = 0;
			for(var i=0; i < entriesToSum.length; i++) { 
				currentEntryBatchNumber = getBatchNumber(entriesToSum[i]);
				if(currentEntryBatchNumber===batch) {
					count++; 
				}
			}
			
			for(i = 0; i < batchEntryCounts.length; i++) {
				if(getBatchNumber(batchEntryCounts[i])===batch) {
					var thisBatchEntryCount = batchEntryCounts[i];
					var sumToCompare = Number(thisBatchEntryCount.innerHTML);
					if(count===sumToCompare) {
						thisBatchEntryCount.style.backgroundColor = "#00FF00";
					} else {
						thisBatchEntryCount.style.backgroundColor = "#FF0000";
						alert("Batch Entry Count for batch " + batch + " does NOT equal the total number of entries.  This file cannot be processed as is.");
					}
				}
			}
			
		}
	}
	
	function getBatchNumber(entry) {
		var classesOfRow = entry.parentElement.className;
		var entryBatchNumber = Number(classesOfRow.substr(classesOfRow.indexOf(" ") + 1));
		return entryBatchNumber;
	}
	
	function preliminaryValidation(txt) {
		var fileLines = txt.split("\n");
		fileLines.forEach(function (element, index) {
			var lineNumber = index + 1;
			if(element.length!==95 && lineNumber!==fileLines.length) { //ensure lines are 94 characters long, but newline counts as a character in JavaScript
				//also ignore last line
				alert("Line " + lineNumber + " is not 94 characters long!  This file cannot be processed. \nIt is " + element.length + " characters long.");
			} else if(lineNumber == fileLines.length && element.length > 2) { //ignore if the last line is empty or has a newline only
				alert("Line " + lineNumber + " is not 94 characters long!  This file cannot be processed. \nIt is " + element.length + " characters long.");
			}
		});
		var lastLine = fileLines.length - 1;
		
		if(lastLine % 10 !==0) {
			alert("The number of lines in this file are not evenly divided by 10.  It is " + lastLine + " lines long.\nYou should fill lines with 9s to end with a number of lines that is an increment of 10.\nThis file should still process successfully, but it is not up to NACHA specs.");
		}
	}
	
	function validateEntryEffectiveDate() {
		var entryEffectiveDates = document.getElementsByClassName("entryEffectiveDate");
		for(entryEffectiveDate = 0; entryEffectiveDate < entryEffectiveDates.length; entryEffectiveDate++) {
			var thisDate = entryEffectiveDates[entryEffectiveDate];
			var today = new Date;
			var enteredDate = new Date(thisDate.innerHTML);
			if(enteredDate < today) {
				alert("Entry Effective Date in batch " + getBatchNumber(thisDate) + " is in the past.  This batch will process as soon as possible, which may be same day.");
				thisDate.style.backgroundColor = "#FF0000";
			} else if(enteredDate === today) {
				alert("Entry Effective Date in batch " + getBatchNumber(thisDate) + " is today.  This batch will process as soon as possible, which may be same day.");
				thisDate.style.backgroundColor = "#FFFF00";
			} else {
				thisDate.style.backgroundColor = "#00FF00";
			}
		}
	}
	
	function validateFileBatchCount() {
		var fileBatchCount = document.getElementById("fileBatchCount");
		var batchesToCompare = Number(fileBatchCount.innerHTML);
		var fileBatches = document.getElementsByClassName("batchHeader");
		if(batchesToCompare!==fileBatches.length) {
			fileBatchCount.style.backgroundColor = "#FF0000";
			alert("The number of batches in the File Control Record is incorrect.  It states there are " + batchesToCompare + " batches, but there are " + fileBatches.length + " Batch Header Records.\nThis will cause problems.");
		} else {
			fileBatchCount.style.backgroundColor = "#00FF00";
		}
	}
	
	function validateFileEntryCount() {
		var fileEntryCount = document.getElementById("fileEntryCount");
		var entriesToCompare = Number(fileEntryCount.innerHTML);
		var fileEntries = document.getElementsByClassName("routingNumber");
		if(entriesToCompare!==fileEntries.length) {
			fileEntryCount.style.backgroundColor = "#FF0000";
			alert("The number of entries in the File Control Record is incorrect.  It states there are " + entriesToCompare + " batches, but there are " + fileEntries.length + " Entry Detail Records.\nThis will cause problems.");
		} else {
			fileEntryCount.style.backgroundColor = "#00FF00";
		}
	}
	
	function validateFileRoutingNumberHash() {
		var routingNumbersToHash = document.getElementsByClassName("routingNumber");

		var count = 0;
		for(var i=0; i < routingNumbersToHash.length; i++) { 
			count += Number((routingNumbersToHash[i].innerHTML).substring(0,8)); 
		}
		var fileEntryHash = document.getElementById("fileEntryHash");
		var hashToCompare = Number(fileEntryHash.innerHTML);
		if(hashToCompare.length > 10) {
			hashToCompare = hashToCompare.substr(hashToCompare.length - 10);
		}
		if(count.length > 10) {
			count = count.substr(count.length - 10);
		}
		if(count === hashToCompare) {
			fileEntryHash.style.backgroundColor = "#00FF00";
		} else {
			fileEntryHash.style.backgroundColor = "#FF0000";
			alert("File Entry Hash does NOT equal the total routing number hash.  This file cannot be processed as is.");
		}
	}
	
	function validateBatchDebitAmount() {
		var entriesToSum = document.getElementsByClassName("entryAmount");
		var numberOfEntries = entriesToSum.length;
		var lastEntry = numberOfEntries - 1;
		var numberOfBatches = getBatchNumber(entriesToSum[lastEntry]);
		var batchDebitAmounts = document.getElementsByClassName("batchDebitAmount");
		
		for(batch=1; batch <= numberOfBatches; batch++) {
			var count = 0;
			for(var i=0; i < entriesToSum.length; i++) { 
				currentEntryBatchNumber = getBatchNumber(entriesToSum[i]);
				if(currentEntryBatchNumber===batch && isDebit(entriesToSum[i])) {
					count += stripCurrency(entriesToSum[i].innerHTML); //https://stackoverflow.com/questions/10473994/javascript-adding-decimal-numbers-issue
				}
			}
			
			for(i = 0; i < batchDebitAmounts.length; i++) {
				if(getBatchNumber(batchDebitAmounts[i])===batch) {
					var thisBatchDebitAmount = batchDebitAmounts[i];
					var sumToCompare = stripCurrency(thisBatchDebitAmount.innerHTML);
					if(count.toFixed(2)===sumToCompare.toFixed(2)) {
						thisBatchDebitAmount.style.backgroundColor = "#00FF00";
					} else {
						thisBatchDebitAmount.style.backgroundColor = "#FF0000";
						alert("Batch Debit Amount for batch " + batch + " does NOT equal the total debit amount of entries.  This file cannot be processed as is.");
					}
				}
			}
			
		}
	}
	
	function validateBatchCreditAmount() {
		var entriesToSum = document.getElementsByClassName("entryAmount");
		var numberOfEntries = entriesToSum.length;
		var lastEntry = numberOfEntries - 1;
		var numberOfBatches = getBatchNumber(entriesToSum[lastEntry]);
		var batchCreditAmounts = document.getElementsByClassName("batchCreditAmount");
		
		
		for(batch=1; batch <= numberOfBatches; batch++) {
			var count = 0;
			for(var i=0; i < entriesToSum.length; i++) { 
				currentEntryBatchNumber = getBatchNumber(entriesToSum[i]);
				if(currentEntryBatchNumber===batch && !isDebit(entriesToSum[i])) {
					count = count + stripCurrency(entriesToSum[i].innerHTML);  //https://stackoverflow.com/questions/10473994/javascript-adding-decimal-numbers-issue
				}
			}
			
			for(i = 0; i < batchCreditAmounts.length; i++) {
				if(getBatchNumber(batchCreditAmounts[i])===batch) {
					var thisBatchCreditAmount = batchCreditAmounts[i];
					var sumToCompare = stripCurrency(thisBatchCreditAmount.innerHTML);
					if(count.toFixed(2)===sumToCompare.toFixed(2)) {
						thisBatchCreditAmount.style.backgroundColor = "#00FF00";
					} else {
						thisBatchCreditAmount.style.backgroundColor = "#FF0000";
						alert("Batch Credit Amount for batch " + batch + " does NOT equal the total credit amount of entries.  This file cannot be processed as is.");
					}
				}
			}
			
		}
	}
	
	function validateFileDebitAmount() {
		var entriesToSum = document.getElementsByClassName("entryAmount");
		var numberOfEntries = entriesToSum.length;
		var lastEntry = numberOfEntries - 1;

		var count = 0;
		for (var i = 0; i < entriesToSum.length; i++) {
			if (isDebit(entriesToSum[i])) {
				count += stripCurrency(entriesToSum[i].innerHTML); //https://stackoverflow.com/questions/10473994/javascript-adding-decimal-numbers-issue
			}
		}

		var fileDebitElement = document.getElementById("fileDebitAmount");
		var sumToCompare = stripCurrency(fileDebitElement.innerHTML);
		if (count.toFixed(2) === sumToCompare.toFixed(2)) {
			fileDebitElement.style.backgroundColor = "#00FF00";
		} else {
			fileDebitElement.style.backgroundColor = "#FF0000";
			alert("File Debit Amount does NOT equal the total debit amount of entries.  This file cannot be processed as is.");
		}
	}

	function validateFileCreditAmount() {
		var entriesToSum = document.getElementsByClassName("entryAmount");
		var numberOfEntries = entriesToSum.length;
		var lastEntry = numberOfEntries - 1;

		var count = 0;
		for (var i = 0; i < entriesToSum.length; i++) {
			if (!isDebit(entriesToSum[i])) {
				count += stripCurrency(entriesToSum[i].innerHTML); //https://stackoverflow.com/questions/10473994/javascript-adding-decimal-numbers-issue
			}
		}

		var fileCreditElement = document.getElementById("fileCreditAmount");
		var sumToCompare = stripCurrency(fileCreditElement.innerHTML);
		if (count.toFixed(2) === sumToCompare.toFixed(2)) {
			fileCreditElement.style.backgroundColor = "#00FF00";
		} else {
			fileCreditElement.style.backgroundColor = "#FF0000";
			alert("File Credit Amount does NOT equal the total debit amount of entries.  This file cannot be processed as is.");
		}
	}

	function isDebit(entry) {
		var classesOfRow = entry.parentElement.className;
		var entryBatchDebitValue = classesOfRow.indexOf("debit");
		if(entryBatchDebitValue >= 0) {
			return true;
		} else {
			return false;
		}
	}
	
	function stripCurrency(number) { //https://stackoverflow.com/questions/10473994/javascript-adding-decimal-numbers-issue
		var newNumber = Number( number.replace(/[^0-9\.]+/g,""));
		return newNumber;
	}