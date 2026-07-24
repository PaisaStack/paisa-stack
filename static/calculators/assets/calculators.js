/* Paisa Stack — shared calculator engine (extracted from the main site's tested code) */
(function(){
  "use strict";

  function toINR(n){
    n = Math.round(n);
    var neg = n < 0;
    n = Math.abs(n);
    var str = n.toLocaleString('en-IN', {maximumFractionDigits:0});
    return (neg? "-" : "") + "₹" + str;
  }
  function pct(n, digits){
    if(digits===undefined) digits=1;
    return (Math.round(n*Math.pow(10,digits))/Math.pow(10,digits)) + "%";
  }
  function bindRange(numId, rangeId, onChange){
    var numEl = document.getElementById(numId);
    var rangeEl = document.getElementById(rangeId);
    function sync(from){
      if(from==='num'){ rangeEl.value = numEl.value; } else { numEl.value = rangeEl.value; }
      onChange();
    }
    numEl.addEventListener('input', function(){ sync('num'); });
    rangeEl.addEventListener('input', function(){ sync('range'); });
  }
  function bindSeg(containerId, cb){
    var container = document.getElementById(containerId);
    var buttons = container.querySelectorAll('button');
    buttons.forEach(function(btn){
      btn.addEventListener('click', function(){
        buttons.forEach(function(b){ b.setAttribute('aria-pressed','false'); });
        btn.setAttribute('aria-pressed','true');
        cb(btn.getAttribute('data-val'));
      });
    });
  }

  function newRegimeTax(taxable){
    var slabs = [
      [0,400000,0],[400000,800000,0.05],[800000,1200000,0.10],
      [1200000,1600000,0.15],[1600000,2000000,0.20],[2000000,2400000,0.25],[2400000,Infinity,0.30]
    ];
    var tax = 0;
    slabs.forEach(function(s){ if(taxable > s[0]){ tax += (Math.min(taxable, s[1]) - s[0]) * s[2]; } });
    if(taxable <= 1200000){ tax = 0; }
    return tax;
  }
  function oldRegimeTax(taxable){
    var slabs = [[0,250000,0],[250000,500000,0.05],[500000,1000000,0.20],[1000000,Infinity,0.30]];
    var tax = 0;
    slabs.forEach(function(s){ if(taxable > s[0]){ tax += (Math.min(taxable, s[1]) - s[0]) * s[2]; } });
    if(taxable <= 500000){ tax = 0; }
    return tax;
  }

  function init_tds(){
    if(!document.getElementById('tds-price')) return;
  // ================= TDS =================
    var tdsPanState = 'yes';
    function calcTDS(){
      var price = parseFloat(document.getElementById('tds-price').value) || 0;
      var stamp = parseFloat(document.getElementById('tds-stamp').value) || 0;
      document.getElementById('tds-price-val').textContent = toINR(price);
      document.getElementById('tds-stamp-val').textContent = toINR(stamp);

      var base = Math.max(price, stamp);
      var threshold = 5000000;
      var rate = tdsPanState === 'yes' ? 0.01 : 0.20;
      var applicable = base >= threshold;
      var tdsAmt = applicable ? base * rate : 0;
      var net = price - tdsAmt;

      document.getElementById('tds-base').textContent = toINR(base);
      document.getElementById('tds-rate').textContent = applicable ? pct(rate*100,0) : '—';
      document.getElementById('tds-amt').textContent = toINR(tdsAmt);
      document.getElementById('tds-net').textContent = toINR(net);
      document.getElementById('tds-rv').textContent = toINR(tdsAmt);

      var heroEl = document.getElementById('tds-hero');
      var rnEl = document.getElementById('tds-rn');
      if(!applicable){
        heroEl.classList.add('calm');
        document.querySelector('#tds-hero .rl').textContent = 'No TDS required';
        rnEl.textContent = 'Both figures are under ₹50 lakh, so this rule doesn\u2019t apply here.';
      } else {
        heroEl.classList.remove('calm');
        document.querySelector('#tds-hero .rl').textContent = 'TDS to deduct';
        rnEl.textContent = tdsPanState === 'yes'
          ? 'Deduct this before paying the seller, then deposit it with the tax department.'
          : 'No PAN on record pushes the rate to 20% — get the seller\u2019s PAN to bring it down to 1%.';
      }
    }
    bindRange('tds-price','tds-price-range', calcTDS);
    bindRange('tds-stamp','tds-stamp-range', calcTDS);
    bindSeg('tds-pan', function(val){ tdsPanState = val; calcTDS(); });
    calcTDS();
  }

  function init_tax(){
    if(!document.getElementById('tax-income')) return;
  // ================= TAX =================
    function calcTax(){
      var income = parseFloat(document.getElementById('tax-income').value) || 0;
      var salaried = document.getElementById('tax-salaried').checked;
      var otherDed = parseFloat(document.getElementById('tax-ded').value) || 0;

      document.getElementById('tax-income-val').textContent = toINR(income);
      document.getElementById('tax-ded-val').textContent = toINR(otherDed);

      var stdDedNew = salaried ? 75000 : 0;
      var stdDedOld = salaried ? 50000 : 0;
      var taxableNew = Math.max(0, income - stdDedNew);
      var taxableOld = Math.max(0, income - stdDedOld - Math.min(otherDed,400000));

      var taxNew = Math.round(newRegimeTax(taxableNew) * 1.04);
      var taxOld = Math.round(oldRegimeTax(taxableOld) * 1.04);

      document.getElementById('tax-taxable-new').textContent = toINR(taxableNew);
      document.getElementById('tax-taxable-old').textContent = toINR(taxableOld);
      document.getElementById('tax-new-amt').textContent = toINR(taxNew);
      document.getElementById('tax-old-amt').textContent = toINR(taxOld);

      var maxAmt = Math.max(taxNew, taxOld, 1);
      document.getElementById('tax-new-bar').style.width = (taxNew/maxAmt*100)+'%';
      document.getElementById('tax-old-bar').style.width = (taxOld/maxAmt*100)+'%';
      document.getElementById('tax-new-bar').className = 'bar-fill' + (taxNew<=taxOld? ' win':' warn');
      document.getElementById('tax-old-bar').className = 'bar-fill' + (taxOld<taxNew? ' win':' warn');

      var lower = Math.min(taxNew, taxOld);
      var diff = Math.abs(taxNew - taxOld);
      var better = taxNew <= taxOld ? 'new' : 'old';

      document.getElementById('tax-rv').textContent = toINR(diff);
      document.getElementById('tax-rn').textContent = 'by picking the ' + better + ' regime.';
      document.getElementById('tax-final').textContent = toINR(lower) + '/yr';

      var flag = document.getElementById('tax-flag');
      if(taxableNew <= 1200000){
        flag.textContent = 'Your new-regime taxable income is at or under ₹12,00,000, so the Section 87A rebate brings that tax to zero.';
      } else if(otherDed >= 150000){
        flag.textContent = 'With ₹1,50,000+ in 80C-type deductions, the old regime narrows the gap — worth checking both every year.';
      } else {
        flag.textContent = 'The new regime is the default from FY 2023-24 onward — you\u2019d need to actively opt for the old one.';
      }
    }
    bindRange('tax-income','tax-income-range', calcTax);
    bindRange('tax-ded','tax-ded-range', calcTax);
    document.getElementById('tax-salaried').addEventListener('change', calcTax);
    calcTax();
  }

  function init_emi(){
    if(!document.getElementById('emi-amt')) return;
  // ================= EMI =================
    function calcEMI(){
      var P = parseFloat(document.getElementById('emi-amt').value) || 0;
      var annualRate = parseFloat(document.getElementById('emi-rate').value) || 0;
      var years = parseFloat(document.getElementById('emi-years').value) || 0;

      document.getElementById('emi-amt-val').textContent = toINR(P);
      document.getElementById('emi-rate-val').textContent = pct(annualRate,2);
      document.getElementById('emi-years-val').textContent = years + ' yrs';

      var r = (annualRate/12)/100;
      var n = years*12;
      var emi = 0;
      if(r === 0 && n>0){ emi = P/n; }
      else if(n>0){ emi = P * r * Math.pow(1+r,n) / (Math.pow(1+r,n)-1); }
      var totalPayment = emi*n;
      var totalInterest = totalPayment - P;

      document.getElementById('emi-rv').textContent = toINR(emi);
      document.getElementById('emi-total-interest').textContent = toINR(totalInterest);
      document.getElementById('emi-total-payment').textContent = toINR(totalPayment);
      document.getElementById('emi-principal-amt').textContent = toINR(P);
      document.getElementById('emi-interest-amt').textContent = toINR(totalInterest);

      var maxV = Math.max(P, totalInterest, 1);
      document.getElementById('emi-principal-bar').style.width = (P/maxV*100)+'%';
      document.getElementById('emi-interest-bar').style.width = (totalInterest/maxV*100)+'%';
    }
    bindRange('emi-amt','emi-amt-range', calcEMI);
    bindRange('emi-rate','emi-rate-range', calcEMI);
    bindRange('emi-years','emi-years-range', calcEMI);
    calcEMI();
  }

  function init_inv(){
    if(!document.getElementById('inv-amt')) return;
  // ================= INVESTMENT =================
    var invMode = 'sip';
    function calcInv(){
      var amt = parseFloat(document.getElementById('inv-amt').value) || 0;
      var annualRate = parseFloat(document.getElementById('inv-rate').value) || 0;
      var years = parseFloat(document.getElementById('inv-years').value) || 0;

      document.getElementById('inv-amt-val').textContent = toINR(amt);
      document.getElementById('inv-rate-val').textContent = pct(annualRate,1);
      document.getElementById('inv-years-val').textContent = years + ' yrs';

      var invested, maturity;
      if(invMode === 'sip'){
        var rMonthly = (annualRate/12)/100;
        var nMonths = years*12;
        invested = amt*nMonths;
        maturity = rMonthly===0 ? invested : amt * ((Math.pow(1+rMonthly,nMonths)-1)/rMonthly) * (1+rMonthly);
        document.getElementById('inv-rn').textContent = 'projected value of your monthly SIP at the end of the term.';
      } else {
        invested = amt;
        maturity = amt * Math.pow(1+annualRate/100, years);
        document.getElementById('inv-rn').textContent = 'projected value of your lump sum at the end of the term.';
      }
      var growth = maturity - invested;

      document.getElementById('inv-rv').textContent = toINR(maturity);
      document.getElementById('inv-total-invested').textContent = toINR(invested);
      document.getElementById('inv-total-value').textContent = toINR(maturity);
      document.getElementById('inv-invested-amt').textContent = toINR(invested);
      document.getElementById('inv-growth-amt').textContent = toINR(growth);

      var maxV = Math.max(invested, growth, 1);
      document.getElementById('inv-invested-bar').style.width = (invested/maxV*100)+'%';
      document.getElementById('inv-growth-bar').style.width = (growth/maxV*100)+'%';
    }
    bindRange('inv-amt','inv-amt-range', calcInv);
    bindRange('inv-rate','inv-rate-range', calcInv);
    bindRange('inv-years','inv-years-range', calcInv);
    bindSeg('inv-mode', function(val){
      invMode = val;
      var label = document.getElementById('inv-amt-label');
      var amtEl = document.getElementById('inv-amt');
      var rangeEl = document.getElementById('inv-amt-range');
      if(val === 'sip'){
        label.textContent = 'Monthly investment';
        amtEl.value = 10000; rangeEl.value = 10000; rangeEl.max = 200000; rangeEl.step = 500;
      } else {
        label.textContent = 'Lump sum amount';
        amtEl.value = 500000; rangeEl.value = 500000; rangeEl.max = 5000000; rangeEl.step = 10000;
      }
      calcInv();
    });
    calcInv();
  }

  function init_hra(){
    if(!document.getElementById('hra-basic')) return;
  // ================= HRA =================
    var hraCity = 'metro';
    function calcHRA(){
      var basic = parseFloat(document.getElementById('hra-basic').value) || 0;
      var received = parseFloat(document.getElementById('hra-received').value) || 0;
      var rent = parseFloat(document.getElementById('hra-rent').value) || 0;
      document.getElementById('hra-basic-val').textContent = toINR(basic);
      document.getElementById('hra-received-val').textContent = toINR(received);
      document.getElementById('hra-rent-val').textContent = toINR(rent);

      var cityPct = hraCity === 'metro' ? 0.5 : 0.4;
      var c1 = received;
      var c2 = Math.max(0, rent - 0.1*basic);
      var c3 = cityPct * basic;
      var exempt = Math.max(0, Math.min(c1, c2, c3));
      var taxable = Math.max(0, received - exempt);

      document.getElementById('hra-rv').textContent = toINR(exempt);
      document.getElementById('hra-c1').textContent = toINR(c1);
      document.getElementById('hra-c2').textContent = toINR(c2);
      document.getElementById('hra-c3').textContent = toINR(c3);
      document.getElementById('hra-taxable').textContent = toINR(taxable);
    }
    bindRange('hra-basic','hra-basic-range', calcHRA);
    bindRange('hra-received','hra-received-range', calcHRA);
    bindRange('hra-rent','hra-rent-range', calcHRA);
    bindSeg('hra-city', function(val){ hraCity = val; calcHRA(); });
    calcHRA();
  }

  function init_capgains(){
    if(!document.getElementById('cg-buy')) return;
  // ================= CAPITAL GAINS =================
    var cgAsset = 'equity';
    var cgOldProp = 'no';
    function calcCG(){
      var buy = parseFloat(document.getElementById('cg-buy').value) || 0;
      var sell = parseFloat(document.getElementById('cg-sell').value) || 0;
      var months = parseFloat(document.getElementById('cg-months').value) || 0;
      document.getElementById('cg-buy-val').textContent = toINR(buy);
      document.getElementById('cg-sell-val').textContent = toINR(sell);
      document.getElementById('cg-months-val').textContent = months + ' mo';

      var gain = sell - buy;
      var isLT, rateLabel, tax, classLabel;

      if(cgAsset === 'equity'){
        isLT = months > 12;
        if(isLT){
          var taxableGain = Math.max(0, gain - 125000);
          tax = taxableGain * 0.125;
          rateLabel = '12.5% above ₹1.25L exemption';
          classLabel = 'Long-term (equity)';
        } else {
          tax = Math.max(0, gain) * 0.20;
          rateLabel = '20% flat';
          classLabel = 'Short-term (equity)';
        }
      } else if(cgAsset === 'debt'){
        isLT = false;
        tax = null;
        rateLabel = 'your income tax slab rate';
        classLabel = 'Always taxed at slab rate (post-Apr 2023 rule)';
      } else {
        isLT = months > 24;
        if(isLT){
          tax = Math.max(0, gain) * 0.125;
          rateLabel = cgOldProp === 'yes' ? '12.5% (or 20% with indexation — check both)' : '12.5% flat, no indexation';
          classLabel = 'Long-term (property/gold)';
        } else {
          tax = null;
          rateLabel = 'your income tax slab rate';
          classLabel = 'Short-term (property/gold) — taxed at slab rate';
        }
      }

      document.getElementById('cg-gain').textContent = toINR(gain);
      document.getElementById('cg-class').textContent = classLabel;
      document.getElementById('cg-rate').textContent = rateLabel;
      if(tax === null){
        document.getElementById('cg-tax').textContent = 'depends on your slab';
        document.getElementById('cg-rv').textContent = '—';
        document.getElementById('cg-rn').textContent = 'taxed at your income slab rate, not a flat rate — check the Income Tax tool.';
      } else {
        document.getElementById('cg-tax').textContent = toINR(tax);
        document.getElementById('cg-rv').textContent = toINR(tax);
        document.getElementById('cg-rn').textContent = 'estimated capital gains tax.';
      }

      document.getElementById('cg-oldprop-field').style.display = (cgAsset === 'other') ? '' : 'none';
      var flagEl = document.getElementById('cg-flag');
      if(cgAsset === 'equity'){
        flagEl.textContent = 'Equity: 12-month LT threshold, 12.5% above ₹1.25L exemption/year. Below 12 months: 20% flat.';
      } else if(cgAsset === 'debt'){
        flagEl.textContent = 'Debt mutual funds bought after April 2023 are always taxed at your income slab rate, regardless of holding period.';
      } else {
        flagEl.textContent = 'Property/gold: 24-month LT threshold. Bought after 23 Jul 2024: 12.5% flat, no indexation. Bought before: you can choose 12.5% (no indexation) or 20% (with indexation) — whichever is lower.';
      }
    }
    bindRange('cg-buy','cg-buy-range', calcCG);
    bindRange('cg-sell','cg-sell-range', calcCG);
    bindRange('cg-months','cg-months-range', calcCG);
    bindSeg('cg-asset', function(val){ cgAsset = val; calcCG(); });
    bindSeg('cg-oldprop', function(val){ cgOldProp = val; calcCG(); });
    calcCG();
  }

  function init_rentbuy(){
    if(!document.getElementById('rb-rent')) return;
  // ================= RENT VS BUY =================
    function calcRentBuy(){
      var rent0 = parseFloat(document.getElementById('rb-rent').value) || 0;
      var price = parseFloat(document.getElementById('rb-price').value) || 0;
      var downPct = parseFloat(document.getElementById('rb-down').value) || 0;
      var rate = parseFloat(document.getElementById('rb-rate').value) || 0;
      var years = parseFloat(document.getElementById('rb-years').value) || 1;
      var appr = parseFloat(document.getElementById('rb-appr').value) || 0;
      var investRate = parseFloat(document.getElementById('rb-inv').value) || 0;

      document.getElementById('rb-rent-val').textContent = toINR(rent0);
      document.getElementById('rb-price-val').textContent = toINR(price);
      document.getElementById('rb-down-val').textContent = downPct + '%';
      document.getElementById('rb-rate-val').textContent = pct(rate,1);
      document.getElementById('rb-years-val').textContent = years + ' yrs';
      document.getElementById('rb-appr-val').textContent = appr + '%';
      document.getElementById('rb-inv-val').textContent = investRate + '%';

      var down = price * downPct/100;
      var loanAmt = price - down;
      var rMonthly = (rate/12)/100;
      var nMonths = years*12; // loan tenure assumed = horizon for simplicity, capped at 30yr amort below
      var amortMonths = 20*12;
      var emi = rMonthly===0 ? loanAmt/amortMonths : loanAmt * rMonthly * Math.pow(1+rMonthly,amortMonths) / (Math.pow(1+rMonthly,amortMonths)-1);

      var balance = loanAmt;
      var totalInterestPaid = 0;
      var rentMonthly = rent0;
      var investCorpus = 0;
      var investMonthlyRate = (investRate/100)/12;
      var horizonMonths = years*12;

      for(var m=1; m<=horizonMonths; m++){
        // buying side
        if(balance > 0){
          var interestPortion = balance * rMonthly;
          var principalPortion = Math.min(balance, emi - interestPortion);
          balance -= principalPortion;
          totalInterestPaid += interestPortion;
        }
        // renting side: invest the difference between (emi) and (rent), if positive
        var diff = emi - rentMonthly;
        if(diff > 0){ investCorpus = investCorpus*(1+investMonthlyRate) + diff; }
        else { investCorpus = investCorpus*(1+investMonthlyRate); }
        // annual rent escalation (assume same % as appreciation isn't linked; use a fixed 5% typical rent growth)
        if(m % 12 === 0){ rentMonthly *= 1.05; }
      }

      var propertyValue = price * Math.pow(1+appr/100, years);
      var buyNet = propertyValue - balance - down - totalInterestPaid + down; // net wealth = property value - remaining loan (down payment already spent, counted as sunk but recovered in property value)
      // Simplify: net position if buying = property value - outstanding loan balance (equity you'd have if you sold)
      var buyNetPosition = propertyValue - balance;
      var rentNetPosition = investCorpus;

      document.getElementById('rb-buy-amt').textContent = toINR(buyNetPosition);
      document.getElementById('rb-rent-amt').textContent = toINR(rentNetPosition);
      var maxV = Math.max(buyNetPosition, rentNetPosition, 1);
      document.getElementById('rb-buy-bar').style.width = (Math.max(0,buyNetPosition)/maxV*100)+'%';
      document.getElementById('rb-rent-bar').style.width = (Math.max(0,rentNetPosition)/maxV*100)+'%';

      var diffFinal = buyNetPosition - rentNetPosition;
      var heroEl = document.getElementById('rb-hero');
      if(diffFinal > 0){
        document.getElementById('rb-rv').textContent = 'Buying wins by ' + toINR(diffFinal);
        heroEl.classList.remove('calm');
      } else {
        document.getElementById('rb-rv').textContent = 'Renting + investing wins by ' + toINR(-diffFinal);
        heroEl.classList.add('calm');
      }
    }
    bindRange('rb-rent','rb-rent-range', calcRentBuy);
    bindRange('rb-price','rb-price-range', calcRentBuy);
    bindRange('rb-down','rb-down-range', calcRentBuy);
    bindRange('rb-rate','rb-rate-range', calcRentBuy);
    bindRange('rb-years','rb-years-range', calcRentBuy);
    bindRange('rb-appr','rb-appr-range', calcRentBuy);
    bindRange('rb-inv','rb-inv-range', calcRentBuy);
    calcRentBuy();
  }

  function init_salary(){
    if(!document.getElementById('sal-ctc')) return;
  // ================= SALARY / IN-HAND =================
    function calcSalary(){
      var ctc = parseFloat(document.getElementById('sal-ctc').value) || 0;
      var basicPct = parseFloat(document.getElementById('sal-basicpct').value) || 40;
      var otherDed = parseFloat(document.getElementById('sal-ded').value) || 0;
      document.getElementById('sal-ctc-val').textContent = toINR(ctc);
      document.getElementById('sal-basic-val').textContent = basicPct + '%';
      document.getElementById('sal-ded-val').textContent = toINR(otherDed);

      var annualBasic = ctc * (basicPct/100);
      var employerPF = annualBasic * 0.12;
      var gratuityAccrual = annualBasic * 0.0481;
      var grossAnnual = Math.max(0, ctc - employerPF - gratuityAccrual);
      var employeePF = annualBasic * 0.12;
      var taxableIncome = Math.max(0, grossAnnual - 75000 - otherDed);
      var annualTax = newRegimeTax(taxableIncome) * 1.04;

      var monthlyGross = grossAnnual / 12;
      var monthlyPF = employeePF / 12;
      var monthlyTDS = annualTax / 12;
      var monthlyProfTax = 200;
      var monthlyNet = monthlyGross - monthlyPF - monthlyTDS - monthlyProfTax;

      document.getElementById('sal-rv').textContent = toINR(monthlyNet);
      document.getElementById('sal-gross').textContent = toINR(monthlyGross);
      document.getElementById('sal-pf').textContent = toINR(monthlyPF);
      document.getElementById('sal-tds').textContent = toINR(monthlyTDS);
      document.getElementById('sal-net').textContent = toINR(monthlyNet);
    }
    bindRange('sal-ctc','sal-ctc-range', calcSalary);
    bindRange('sal-basicpct','sal-basicpct-range', calcSalary);
    bindRange('sal-ded','sal-ded-range', calcSalary);
    calcSalary();
  }

  function init_gratuity(){
    if(!document.getElementById('gr-basic')) return;
  // ================= GRATUITY =================
    function calcGratuity(){
      var basic = parseFloat(document.getElementById('gr-basic').value) || 0;
      var years = parseFloat(document.getElementById('gr-years').value) || 0;
      document.getElementById('gr-basic-val').textContent = toINR(basic);
      document.getElementById('gr-years-val').textContent = years + ' yrs';

      var raw = basic * (15/26) * years;
      var ceiling = 2000000;
      var payable = years >= 5 ? Math.min(raw, ceiling) : 0;
      var taxable = Math.max(0, payable - Math.min(payable, ceiling));

      document.getElementById('gr-rv').textContent = toINR(payable);
      document.getElementById('gr-calc').textContent = toINR(raw);
      document.getElementById('gr-taxable').textContent = toINR(taxable);

      var flagEl = document.getElementById('gr-flag');
      var rnEl = document.querySelector('#gr-hero .rn');
      if(years < 5){
        flagEl.textContent = 'Under 5 years of service — not eligible for gratuity under standard rules (exceptions apply for death or disability).';
        rnEl.textContent = 'not eligible yet — needs 5+ years of service.';
      } else {
        flagEl.textContent = 'Eligible after 5+ years of continuous service (private sector). Exempt up to ₹20,00,000 — the lowest of actual gratuity, the ceiling, or the formula amount.';
        rnEl.textContent = 'fully tax-exempt (under ₹20L ceiling).';
      }
    }
    bindRange('gr-basic','gr-basic-range', calcGratuity);
    bindRange('gr-years','gr-years-range', calcGratuity);
    calcGratuity();
  }

  function init_freelance(){
    if(!document.getElementById('fl-gross')) return;
  // ================= FREELANCE TAX (44ADA) =================
    var flDigital = 'yes';
    function calcFreelance(){
      var gross = parseFloat(document.getElementById('fl-gross').value) || 0;
      var actualExp = parseFloat(document.getElementById('fl-exp').value) || 0;
      document.getElementById('fl-gross-val').textContent = toINR(gross);
      document.getElementById('fl-exp-val').textContent = toINR(actualExp);

      var limit = flDigital === 'yes' ? 7500000 : 5000000;
      var eligible = gross <= limit;
      var presumptiveIncome = gross * 0.5;
      var taxable44 = Math.max(0, presumptiveIncome - 75000);
      var tax44 = newRegimeTax(taxable44) * 1.04;

      var actualProfit = Math.max(0, gross - actualExp);
      var taxableActual = Math.max(0, actualProfit - 75000);
      var taxActual = newRegimeTax(taxableActual) * 1.04;

      document.getElementById('fl-rv').textContent = toINR(presumptiveIncome);
      document.getElementById('fl-limit').textContent = toINR(limit);
      document.getElementById('fl-eligible').textContent = eligible ? 'Yes' : 'No — exceeds limit';
      document.getElementById('fl-tax-44ada').textContent = toINR(tax44);
      document.getElementById('fl-tax-actual').textContent = actualExp > 0 ? toINR(taxActual) : '—';

      var flagEl = document.getElementById('fl-flag');
      if(!eligible){
        flagEl.textContent = 'Your receipts exceed the 44ADA limit — regular books of account and possibly an audit may apply. Check with a CA.';
      } else if(actualExp > 0 && taxActual < tax44){
        flagEl.textContent = 'Based on what you entered, declaring actual profit looks cheaper than the 44ADA presumptive rate this year.';
      } else {
        flagEl.textContent = 'If your real expenses are under 50% of receipts, 44ADA usually wins — you\u2019re taxed on less than you\u2019d otherwise show as profit.';
      }
    }
    bindRange('fl-gross','fl-gross-range', calcFreelance);
    bindRange('fl-exp','fl-exp-range', calcFreelance);
    bindSeg('fl-digital', function(val){ flDigital = val; calcFreelance(); });
    calcFreelance();
  }

  function init_prepay(){
    if(!document.getElementById('pp-amt')) return;
  // ================= LOAN PREPAYMENT =================
    function calcPrepay(){
      var P = parseFloat(document.getElementById('pp-amt').value) || 0;
      var annualRate = parseFloat(document.getElementById('pp-rate').value) || 0;
      var years = parseFloat(document.getElementById('pp-years').value) || 0;
      var extra = parseFloat(document.getElementById('pp-extra').value) || 0;

      document.getElementById('pp-amt-val').textContent = toINR(P);
      document.getElementById('pp-rate-val').textContent = pct(annualRate,2);
      document.getElementById('pp-years-val').textContent = years + ' yrs';
      document.getElementById('pp-extra-val').textContent = toINR(extra);

      var r = (annualRate/12)/100;
      var n = years*12;
      var emi = r===0 ? P/n : P * r * Math.pow(1+r,n) / (Math.pow(1+r,n)-1);
      var originalTotalInterest = emi*n - P;

      var balance = P;
      var totalInterestNew = 0;
      var months = 0;
      while(balance > 0 && months < n){
        months++;
        var interestPortion = balance * r;
        var principalPortion = Math.min(balance, (emi - interestPortion) + extra);
        balance -= principalPortion;
        totalInterestNew += interestPortion;
        if(principalPortion <= 0) break;
      }

      var interestSaved = originalTotalInterest - totalInterestNew;
      var monthsSaved = n - months;

      document.getElementById('pp-rv').textContent = toINR(Math.max(0,interestSaved));
      document.getElementById('pp-emi').textContent = toINR(emi);
      document.getElementById('pp-newtenure').textContent = Math.floor(months/12) + ' yrs ' + (months%12) + ' mo';
      document.getElementById('pp-timesaved').textContent = Math.floor(monthsSaved/12) + ' yrs ' + (monthsSaved%12) + ' mo';
      document.getElementById('pp-interestcompare').textContent = toINR(originalTotalInterest) + ' \u2192 ' + toINR(totalInterestNew);
    }
    bindRange('pp-amt','pp-amt-range', calcPrepay);
    bindRange('pp-rate','pp-rate-range', calcPrepay);
    bindRange('pp-years','pp-years-range', calcPrepay);
    bindRange('pp-extra','pp-extra-range', calcPrepay);
    calcPrepay();
  }

  function init_goal(){
    if(!document.getElementById('gp-target')) return;
  // ================= GOAL PLANNER =================
    function calcGoal(){
      var target = parseFloat(document.getElementById('gp-target').value) || 0;
      var years = parseFloat(document.getElementById('gp-years').value) || 1;
      var infl = parseFloat(document.getElementById('gp-infl').value) || 0;
      var ret = parseFloat(document.getElementById('gp-return').value) || 0;

      document.getElementById('gp-target-val').textContent = toINR(target);
      document.getElementById('gp-years-val').textContent = years + ' yrs';
      document.getElementById('gp-infl-val').textContent = infl + '%';
      document.getElementById('gp-return-val').textContent = ret + '%';

      var futureValue = target * Math.pow(1+infl/100, years);
      var rMonthly = (ret/100)/12;
      var nMonths = years*12;
      var sip;
      if(rMonthly === 0){
        sip = futureValue / nMonths;
      } else {
        var factor = ((Math.pow(1+rMonthly,nMonths)-1)/rMonthly) * (1+rMonthly);
        sip = futureValue / factor;
      }
      var totalInvested = sip * nMonths;

      document.getElementById('gp-rv').textContent = toINR(sip);
      document.getElementById('gp-today').textContent = toINR(target);
      document.getElementById('gp-future').textContent = toINR(futureValue);
      document.getElementById('gp-invested').textContent = toINR(totalInvested);
    }
    bindRange('gp-target','gp-target-range', calcGoal);
    bindRange('gp-years','gp-years-range', calcGoal);
    bindRange('gp-infl','gp-infl-range', calcGoal);
    bindRange('gp-return','gp-return-range', calcGoal);
    calcGoal();
  }

  function init_ppf(){
    if(!document.getElementById('ppf-amt')) return;
  // ================= PPF =================
    var ppfYears = 15;
    function calcPPF(){
      var yearly = parseFloat(document.getElementById('ppf-amt').value) || 0;
      var rate = parseFloat(document.getElementById('ppf-rate').value) || 0;
      document.getElementById('ppf-amt-val').textContent = toINR(yearly);
      document.getElementById('ppf-rate-val').textContent = pct(rate,1);
      document.getElementById('ppf-years-val').textContent = ppfYears + ' yrs';

      var balance = 0;
      for(var y=1; y<=ppfYears; y++){
        balance = (balance + yearly) * (1 + rate/100);
      }
      var invested = yearly * ppfYears;
      var interest = balance - invested;

      document.getElementById('ppf-rv').textContent = toINR(balance);
      document.getElementById('ppf-invested').textContent = toINR(invested);
      document.getElementById('ppf-interest').textContent = toINR(interest);
    }
    bindRange('ppf-amt','ppf-amt-range', calcPPF);
    bindRange('ppf-rate','ppf-rate-range', calcPPF);
    bindSeg('ppf-years-seg', function(val){ ppfYears = parseInt(val,10); calcPPF(); });
    calcPPF();
  }

  function init_epf(){
    if(!document.getElementById('epf-age')) return;
  // ================= EPF =================
    function calcEPF(){
      var age = parseFloat(document.getElementById('epf-age').value) || 18;
      var basic = parseFloat(document.getElementById('epf-basic').value) || 0;
      var growth = parseFloat(document.getElementById('epf-growth').value) || 0;
      var rate = parseFloat(document.getElementById('epf-rate').value) || 0;

      document.getElementById('epf-age-val').textContent = age;
      document.getElementById('epf-basic-val').textContent = toINR(basic);
      document.getElementById('epf-growth-val').textContent = growth + '%';
      document.getElementById('epf-rate-val').textContent = pct(rate,2);

      var yearsLeft = Math.max(0, 58 - age);
      var monthlyRate = (rate/100)/12;
      var balance = 0;
      var totalContributed = 0;
      var currentBasic = basic;
      for(var y=0; y<yearsLeft; y++){
        var monthlyContribution = currentBasic * 0.24;
        for(var m=0; m<12; m++){
          balance = balance*(1+monthlyRate) + monthlyContribution;
          totalContributed += monthlyContribution;
        }
        currentBasic *= (1 + growth/100);
      }

      document.getElementById('epf-rv').textContent = toINR(balance);
      document.getElementById('epf-yrsleft').textContent = yearsLeft;
      document.getElementById('epf-contributed').textContent = toINR(totalContributed);
    }
    bindRange('epf-age','epf-age-range', calcEPF);
    bindRange('epf-basic','epf-basic-range', calcEPF);
    bindRange('epf-growth','epf-growth-range', calcEPF);
    bindRange('epf-rate','epf-rate-range', calcEPF);
    calcEPF();
  }

  function init_nps(){
    if(!document.getElementById('nps-age')) return;
  // ================= NPS =================
    function calcNPS(){
      var age = parseFloat(document.getElementById('nps-age').value) || 18;
      var contrib = parseFloat(document.getElementById('nps-contrib').value) || 0;
      var ret = parseFloat(document.getElementById('nps-return').value) || 0;
      var annPct = parseFloat(document.getElementById('nps-annpct').value) || 40;
      var annRate = parseFloat(document.getElementById('nps-annrate').value) || 0;

      document.getElementById('nps-age-val').textContent = age;
      document.getElementById('nps-contrib-val').textContent = toINR(contrib);
      document.getElementById('nps-return-val').textContent = ret + '%';
      document.getElementById('nps-annpct-val').textContent = annPct + '%';
      document.getElementById('nps-annrate-val').textContent = pct(annRate,2);

      var yearsLeft = Math.max(0, 60 - age);
      var nMonths = yearsLeft*12;
      var rMonthly = (ret/100)/12;
      var corpus = rMonthly===0 ? contrib*nMonths : contrib * ((Math.pow(1+rMonthly,nMonths)-1)/rMonthly) * (1+rMonthly);

      var annuityCorpus = corpus * (annPct/100);
      var lumpSum = corpus - annuityCorpus;
      var monthlyPension = (annuityCorpus * (annRate/100)) / 12;

      document.getElementById('nps-rv').textContent = toINR(corpus);
      document.getElementById('nps-lumpsum').textContent = toINR(lumpSum);
      document.getElementById('nps-anncorpus').textContent = toINR(annuityCorpus);
      document.getElementById('nps-pension').textContent = toINR(monthlyPension);
    }
    bindRange('nps-age','nps-age-range', calcNPS);
    bindRange('nps-contrib','nps-contrib-range', calcNPS);
    bindRange('nps-return','nps-return-range', calcNPS);
    bindRange('nps-annpct','nps-annpct-range', calcNPS);
    bindRange('nps-annrate','nps-annrate-range', calcNPS);
    calcNPS();
  }

  window.__paisaCalcInit = {
    't-tds': init_tds,
    't-tax': init_tax,
    't-emi': init_emi,
    't-inv': init_inv,
    't-hra': init_hra,
    't-capgains': init_capgains,
    't-rentbuy': init_rentbuy,
    't-salary': init_salary,
    't-gratuity': init_gratuity,
    't-freelance': init_freelance,
    't-prepay': init_prepay,
    't-goal': init_goal,
    't-ppf': init_ppf,
    't-epf': init_epf,
    't-nps': init_nps
  };

})();