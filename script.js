document.addEventListener('DOMContentLoaded', function() {
    const categories = [
        { name: 'หนี้สิน', color: '#FF6384', allowPercentage: false },
        { name: 'คืนตัวเอง', color: '#36A2EB', allowPercentage: false },
        { name: 'การลงทุน', color: '#FFCE56', allowPercentage: false },
        { name: 'ค่าใช้จ่าย', color: '#4BC0C0', allowPercentage: true },
        { name: 'เงินออม', color: '#9966FF', allowPercentage: true }
    ];

    const state = {
        salary: 0,
        categories: categories.map(cat => ({ ...cat, items: [] }))
    };

    function renderItems(categoryIndex) {
        const itemsContainer = document.getElementById(`items-${categoryIndex}`);
        itemsContainer.innerHTML = '';

        state.categories[categoryIndex].items.forEach((item, itemIndex) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'flex flex-row w-full gap-2 mb-3';
            itemElement.innerHTML = `
                <div class="w-full space-y-3">
                    <input type="text" class="text-input border py-3 px-4 block w-full border-gray-200 rounded-lg  focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 
                    disabled:pointer-events-none " 
                    placeholder="ชื่อรายการ" value="${item.name}" onchange="updateItem(${categoryIndex}, ${itemIndex}, 'name', this.value)">
                </div>
                ${state.categories[categoryIndex].allowPercentage ? `
                    <select class="text-input border rounded-md h-11" onchange="updateItem(${categoryIndex}, ${itemIndex}, 'type', this.value)">
                        <option value="fixed" ${item.type === 'fixed' ? 'selected' : ''}>จำนวนเงินคงที่</option>
                        <option value="percentage" ${item.type === 'percentage' ? 'selected' : ''}>เปอร์เซ็นต์</option>
                    </select>
                ` : ''}
                <div class="w-full">
                    <input type="text" class="text-input border py-3 px-4 block w-full border-gray-200 rounded-lg  focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 
                    disabled:pointer-events-none " 
                    placeholder="This is placeholder" value="${item.type === 'percentage' ? item.percentage : item.amount}" 
                       onchange="updateItem(${categoryIndex}, ${itemIndex}, '${item.type === 'percentage' ? 'percentage' : 'amount'}', parseFloat(this.value) || 0)">
                </div>    
                <button onclick="removeItem(${categoryIndex}, ${itemIndex})" type="button fill-white"
                    class=" flex shrink-0 justify-center items-center gap-2 size-[46px] text-sm font-medium rounded-lg border border-transparent bg-white text-white hover:bg-gray-100 focus:outline-none focus:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none">
                    <img class="filter-to-white size-[20px]" src="/icon/minus-circle.svg" alt="">
                </button>
            `;
            itemsContainer.appendChild(itemElement);
        });
    }

    window.addItem = function(categoryIndex) {
        state.categories[categoryIndex].items.push({ name: '', amount: 0, percentage: 0, type: 'fixed' });
        renderItems(categoryIndex);
        calculate();
    };

    window.updateItem = function(categoryIndex, itemIndex, field, value) {
        state.categories[categoryIndex].items[itemIndex][field] = value;
        if (field === 'type') {
            state.categories[categoryIndex].items[itemIndex].percentage = 0;
            state.categories[categoryIndex].items[itemIndex].amount = 0;
        }
        renderItems(categoryIndex);
        calculate();
    };

    window.removeItem = function(categoryIndex, itemIndex) {
        state.categories[categoryIndex].items.splice(itemIndex, 1);
        renderItems(categoryIndex);
        calculate();
    };

    function calculate() {
        const salary = parseFloat(document.getElementById('salary').value) || 0;
        state.salary = salary;
    
        let remaining = salary;
        const summary = [];
        const chartData = [];
    
        // คำนวณจำนวนเงินคงที่สำหรับสามหมวดแรก
        state.categories.slice(0, 3).forEach(category => {
            let categoryTotal = 0;
            let categoryHtml = `
                <div class="p-5 rounded-lg flex flex-col gap-4 bg-gray-50 summary-category border w-full">
                    <h3 class="headtext w-full">${category.name}</h3>
            `;
            
            category.items.forEach(item => {
                const itemAmount = item.amount || 0;
                categoryTotal += itemAmount;
                
                categoryHtml += `<div class="text-input flex flex-row border-b pb-2 w-full">
                                    <p class="w-full">${item.name}</p>
                                    <div class="flex flex-row gap-2">
                                        <p class=""> ${itemAmount.toFixed(2)}</p>
                                        <p>บาท</p>                                    
                                    </div>
                                </div> `;
            });
            
            remaining -= categoryTotal;
            categoryHtml += `<p class="headtext flex w-full justify-end">รวม: ${categoryTotal.toFixed(2)} บาท</p></div>`;
            
            summary.push(categoryHtml);
            chartData.push({ name: category.name, value: categoryTotal, color: category.color });
        });
    
        // แทรกจำนวนเงินคงเหลือหลังจากหักค่าใช้จ่ายคงที่จากสามหมวดแรก
        summary.splice(3, 0, `
            <div class="place-items-center p-5 flex flex-col gap-4  bg-emerald-50 border rounded border-emerald-600">
                <h3 class="headtext-remain">คงเหลือ</h3>
                <p class="subtext-remain">${remaining.toFixed(2)} บาท</p>
            </div>
        `);
    
        let fixedExpensesTotal = 0;
        let percentageItems = [];
    
        // คำนวณจำนวนเงินคงที่สำหรับสองหมวดสุดท้าย (ค่าใช้จ่ายและเงินออม)
        state.categories.slice(3).forEach(category => {
            category.items.forEach(item => {
                if (item.type === 'fixed') {
                    fixedExpensesTotal += item.amount || 0;
                } else {
                    percentageItems.push({ ...item, category });
                }
            });
        });
    
        // ตรวจสอบว่าค่าใช้จ่ายคงที่เกินจำนวนเงินคงเหลือหรือไม่
        const alertElement = document.getElementById('alert');
        if (fixedExpensesTotal >= remaining) {
            alertElement.style.display = 'block';
            alertElement.textContent = 'คำเตือน: ค่าใช้จ่ายคงที่รวมกันเกินหรือเท่ากับงบประมาณคงเหลือ!';
        } else {
            alertElement.style.display = 'none';

            const remainingAfterFixed = remaining - fixedExpensesTotal;

            // คำนวณผลรวมของเปอร์เซ็นต์
            const totalPercentage = percentageItems.reduce((sum, item) => sum + (parseFloat(item.percentage) || 0), 0);
            
            // ตรวจสอบว่าผลรวมของเปอร์เซ็นต์เกิน 100% หรือไม่
            if (totalPercentage > 100) {
                alertElement.style.display = 'block';
                alertElement.textContent = 'คำเตือน: ผลรวมของเปอร์เซ็นต์ในสองหมวดสุดท้ายเกิน 100%!';
            } else {
                // คำนวณและแสดงสรุปสำหรับสองหมวดสุดท้าย
                state.categories.slice(3).forEach(category => {
                    let categoryTotal = 0;
                    let categoryHtml = `
                        <div class="p-5 rounded-lg flex flex-col gap-4 bg-gray-50 summary-category border w-full">
                            <h3 class="headtext w-full">${category.name}</h3>
                    `;
        
                    category.items.forEach(item => {
                        let itemAmount;
                        if (item.type === 'fixed') {
                            itemAmount = item.amount || 0;
                            categoryHtml += `<div class="text-input flex  border-b pb-2 w-full items-center">
                                        <p class="w-full  h-fit">${item.name}</p>
                                        <div class="w-full flex flex-row gap-2 justify-end">
                                            <p class=" px-3 py-1 rounded-full bg-blue-600 text-white text-sm">จำนวนคงที่</p>
                                            <div class="flex items-center gap-2">
                                                <p class="h-fit ">${itemAmount.toFixed(2)}</p>
                                                <p class=" h-fit">บาท</p>                                    
                                            </div>
                                        </div>
                                    </div> `;
                        } else {
                            itemAmount = (item.percentage / 100) * remainingAfterFixed;
                            categoryHtml += `<div class="text-input flex  border-b pb-2 w-full items-center">
                                        <p class="w-full h-fit">${item.name}</p>
                                        <div class="flex flex-row gap-2 items-center">
                                            <p class="h-fit px-3 py-1 rounded-full bg-emerald-500 text-white text-sm">${item.percentage}%</p>
                                            <p class="h-fit"> ${itemAmount.toFixed(2)}</p>
                                            <p class="h-fit">บาท</p>                                    
                                        </div>
                                    </div> `;
                        }
                        categoryTotal += itemAmount;
                    });
                    
                    categoryHtml += `<p class="headtext flex w-full justify-end">รวม: ${categoryTotal.toFixed(2)} บาท</p></div>`;
                    summary.push(categoryHtml);
                    chartData.push({ name: category.name, value: categoryTotal, color: category.color });
                });
            }
        }
    
        document.getElementById('summary').innerHTML = summary.join('');
        renderChart(chartData);
    }

    function renderChart(data) {
        const ctx = document.getElementById('pieChart');
        if (window.myPieChart) {
            window.myPieChart.destroy();
        }
    
        // คำนวณผลรวมของ 5 หมวด
        const totalExpenses = data.reduce((sum, item) => sum + item.value, 0);
    
        window.myPieChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: data.map(item => item.name),
                datasets: [{
                    data: data.map(item => item.value),
                    backgroundColor: data.map(item => item.color)
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    title: {
                        display: true,
                        text: `ยอดรวมค่าใช้จ่าย (5 หมวด): ${totalExpenses.toFixed(2)} บาท`
                    }
                }
            }
        });
    }

    function loadSavedData() {
        const savedData = localStorage.getItem('budgetData');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            state.salary = parsedData.salary;
            state.categories = parsedData.categories;
            document.getElementById('salary').value = state.salary;
            state.categories.forEach((_, index) => renderItems(index));
            calculate();
        }
    }

    function saveData() {
        const dataToSave = {
            salary: state.salary,
            categories: state.categories
        };
        localStorage.setItem('budgetData', JSON.stringify(dataToSave));
        alert('ข้อมูลถูกบันทึกเรียบร้อยแล้ว');
    }

    document.getElementById('salary').addEventListener('input', calculate);
    document.getElementById('saveButton').addEventListener('click', saveData);

    const saveStatsButton = document.getElementById('saveStatsButton');
    const saveStatsModal = document.getElementById('saveStatsModal');
    const confirmSaveStats = document.getElementById('confirmSaveStats');
    const cancelSaveStats = document.getElementById('cancelSaveStats');
    const monthNameInput = document.getElementById('monthName');
    const savedStatsList = document.getElementById('savedStatsList');

    saveStatsButton.addEventListener('click', () => {
        saveStatsModal.style.display = 'block';
    });

    cancelSaveStats.addEventListener('click', () => {
        saveStatsModal.style.display = 'none';
    });

    confirmSaveStats.addEventListener('click', () => {
        const monthName = monthNameInput.value.trim();
        if (monthName) {
            saveStatistics(monthName);
            saveStatsModal.style.display = 'none';
            monthNameInput.value = '';
        } else {
            alert('กรุณาใส่ชื่อเดือน');
        }
    });

    function saveStatistics(monthName) {
        const summaryHTML = document.getElementById('summary').innerHTML;
        const chartData = window.myPieChart.data;
        
        const savedStats = JSON.parse(localStorage.getItem('savedStats') || '[]');
        savedStats.push({ monthName, summaryHTML, chartData, date: new Date().toISOString() });
        localStorage.setItem('savedStats', JSON.stringify(savedStats));
        
        renderSavedStatsList();
    }

    function renderSavedStatsList() {
        const savedStats = JSON.parse(localStorage.getItem('savedStats') || '[]');
        savedStatsList.innerHTML = '';
        
        savedStats.forEach((stat, index) => {
            const statElement = document.createElement('div');
            statElement.className = 'saved-stat';
            statElement.innerHTML = `
                <div class="flex flex-row mb-4 border-b pb-3 items-center ">
                    <h3 class="text w-fit px-10">${stat.monthName}</h3>
                    <p class="w-full px-10 subtext " >บันทึกเมื่อ: ${new Date(stat.date).toLocaleString()}</p>
                    <div class="flex w-fit justify-end item-end gap-4 ">

                        <button onclick="viewSavedStat(${index})"  type="button fill-white"
                            class=" flex shrink-0 justify-center items-center gap-2 size-[40px] text-sm font-medium 
                            rounded-lg border border-transparent bg-white text-white hover:bg-gray-100">
                            <img class="filter-to-white size-[20px]" src="/icon/see.svg" alt="">
                        </button>

                        <button onclick="deleteSavedStat(${index})"  type="button fill-white"
                            class=" flex shrink-0 justify-center items-center gap-2 size-[40px] text-sm font-medium 
                            rounded-lg border border-transparent bg-white text-white hover:bg-gray-100">
                            <img class="filter-to-white size-[20px]" src="/icon/delete.svg" alt="">
                        </button>
                    </div>
                </div>
            `;
            savedStatsList.appendChild(statElement);
        });
    }

    window.viewSavedStat = function(index) {
        const savedStats = JSON.parse(localStorage.getItem('savedStats') || '[]');
        const stat = savedStats[index];
        
        // แสดงชื่อเดือนที่กำลังดู
        const summaryElement = document.getElementById('summary');
        summaryElement.innerHTML = `<h2 class="headtext mb-4">สรุปของเดือน: ${stat.monthName}</h2>` + stat.summaryHTML;
        
        // แก้ไขสไตล์ของกล่องสรุปและรายการย่อยให้เหมือนหน้าปกติ
        const summaryCategories = summaryElement.querySelectorAll('.summary-category');
        summaryCategories.forEach(category => {
            category.className = 'p-5 rounded-lg flex flex-col gap-4 bg-gray-50 summary-category border w-full';
            
            // ปรับแต่งหัวข้อหมวดหมู่
            const categoryTitle = category.querySelector('h3');
            if (categoryTitle) {
                categoryTitle.className = 'headtext w-full';
            }
    
            // ปรับแต่งรายการย่อย
            const items = category.querySelectorAll('.text-input');
            items.forEach(item => {
                item.className = 'text-input flex border-b pb-2 w-full items-center ';
                
                // ปรับแต่งชื่อรายการ
                const itemName = item.querySelector('p:first-child');
                if (itemName) {
                    itemName.className = 'w-full h-fit ';
                }
    
                // ปรับแต่งส่วนแสดงจำนวนเงินและเปอร์เซ็นต์
                const itemValueContainer = item.querySelector('div:last-child');
                if (itemValueContainer) {
                    itemValueContainer.className = 'w-full flex flex-row gap-2 justify-end ';
    
                    // ปรับแต่ง label จำนวนคงที่หรือเปอร์เซ็นต์
                    const label = itemValueContainer.querySelector('p:first-child');
                    if (label) {
                        if (label.textContent.includes('%')) {
                            label.className = 'h-fit px-3 py-1 rounded-full bg-emerald-500 text-white text-sm';
                        } else {
                            label.className = 'text-input';
                        }
                    }
    
                    // ปรับแต่งส่วนแสดงจำนวนเงิน
                    const amountContainer = itemValueContainer.querySelector('div:last-child');
                    if (amountContainer) {
                        amountContainer.className = 'flex items-center gap-2';
                    }
                }
            });
    
            // ปรับแต่งยอดรวมของหมวดหมู่
            const categoryTotal = category.querySelector('p:last-child');
            if (categoryTotal) {
                categoryTotal.className = 'text-input';
            }
        });
    
        // ปรับแต่งส่วนแสดงยอดคงเหลือ
        const remainingElement = summaryElement.querySelector('.place-items-center');
        if (remainingElement) {
            remainingElement.className = 'place-items-center p-5 flex flex-col gap-4 bg-emerald-50 border rounded border-emerald-600';
            const remainingTitle = remainingElement.querySelector('h3');
            if (remainingTitle) {
                remainingTitle.className = 'headtext-remain';
            }
            const remainingAmount = remainingElement.querySelector('p');
            if (remainingAmount) {
                remainingAmount.className = 'subtext-remain';
            }
        }
        
        if (window.myPieChart) {
            window.myPieChart.destroy();
        }
        
        const ctx = document.getElementById('pieChart');
        window.myPieChart = new Chart(ctx, {
            type: 'pie',
            data: stat.chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    title: {
                        display: true,
                        text: `ยอดรวมค่าใช้จ่าย (5 หมวด): ${calculateTotalExpenses(stat.chartData).toFixed(2)} บาท`
                    }
                }
            }
        });
    };
    
    // ฟังก์ชันช่วยคำนวณยอดรวมค่าใช้จ่าย
    function calculateTotalExpenses(chartData) {
        return chartData.datasets[0].data.reduce((sum, value) => sum + value, 0);
    }

    window.deleteSavedStat = function(index) {
        if (confirm('คุณแน่ใจหรือไม่ที่จะลบสถิตินี้?')) {
            const savedStats = JSON.parse(localStorage.getItem('savedStats') || '[]');
            savedStats.splice(index, 1);
            localStorage.setItem('savedStats', JSON.stringify(savedStats));
            renderSavedStatsList();
        }
    };

    // เรียกใช้ฟังก์ชันเหล่านี้เพื่อเริ่มต้นการทำงาน
    loadSavedData();
    state.categories.forEach((_, index) => renderItems(index));
    calculate();
    renderSavedStatsList();
});