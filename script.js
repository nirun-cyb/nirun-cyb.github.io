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

    function renderCategories() {
        const categoriesContainer = document.getElementById('categories');
        categoriesContainer.innerHTML = '';

        state.categories.forEach((category, categoryIndex) => {
            const categoryElement = document.createElement('div');
            categoryElement.className = 'card mb-4';
            categoryElement.innerHTML = `
                <div class="card-header">
                    <h2 class="card-title" style="color: ${category.color}">${category.name}</h2>
                </div>
                <div class="card-content">
                    <div id="items-${categoryIndex}"></div>
                    <button onclick="addItem(${categoryIndex})">เพิ่มรายการ</button>
                </div>
            `;
            categoriesContainer.appendChild(categoryElement);

            renderItems(categoryIndex);
        });
    }

    function renderItems(categoryIndex) {
        const itemsContainer = document.getElementById(`items-${categoryIndex}`);
        itemsContainer.innerHTML = '';

        state.categories[categoryIndex].items.forEach((item, itemIndex) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'flex mb-2';
            itemElement.innerHTML = `
                <input type="text" class="flex-grow mr-2" value="${item.name}" onchange="updateItem(${categoryIndex}, ${itemIndex}, 'name', this.value)" placeholder="ชื่อรายการ">
                ${state.categories[categoryIndex].allowPercentage ? `
                    <select class="mr-2" onchange="updateItem(${categoryIndex}, ${itemIndex}, 'type', this.value)">
                        <option value="fixed" ${item.type === 'fixed' ? 'selected' : ''}>จำนวนเงินคงที่</option>
                        <option value="percentage" ${item.type === 'percentage' ? 'selected' : ''}>เปอร์เซ็นต์</option>
                    </select>
                ` : ''}
                <input type="number" class="mr-2" style="width: 100px;" value="${item.type === 'percentage' ? item.percentage : item.amount}" 
                       onchange="updateItem(${categoryIndex}, ${itemIndex}, '${item.type === 'percentage' ? 'percentage' : 'amount'}', parseFloat(this.value) || 0)"
                       placeholder="${item.type === 'percentage' ? '%' : 'บาท'}">
                <button onclick="removeItem(${categoryIndex}, ${itemIndex})">ลบ</button>
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
                <div class="summary-category">
                    <h3>${category.name}</h3>
            `;
            
            category.items.forEach(item => {
                const itemAmount = item.amount || 0;
                categoryTotal += itemAmount;
                categoryHtml += `<p>${item.name}: ${itemAmount.toFixed(2)} บาท</p>`;
            });
            
            remaining -= categoryTotal;
            categoryHtml += `<p><strong>รวม: ${categoryTotal.toFixed(2)} บาท</strong></p></div>`;
            
            summary.push(categoryHtml);
            chartData.push({ name: category.name, value: categoryTotal, color: category.color });
        });
    
        // แทรกจำนวนเงินคงเหลือหลังจากหักค่าใช้จ่ายคงที่จากสามหมวดแรก
        summary.splice(3, 0, `
            <div class="summary-category">
                <h3>คงเหลือ</h3>
                <p>${remaining.toFixed(2)} บาท</p>
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
    
            // คำนวณและแสดงสรุปสำหรับสองหมวดสุดท้าย
            state.categories.slice(3).forEach(category => {
                let categoryTotal = 0;
                let categoryHtml = `
                    <div class="summary-category">
                        <h3>${category.name}</h3>
                `;
    
                category.items.forEach(item => {
                    let itemAmount;
                    if (item.type === 'fixed') {
                        itemAmount = item.amount || 0;
                        categoryHtml += `<p>${item.name}: ${itemAmount.toFixed(2)} บาท (คงที่)</p>`;
                    } else {
                        itemAmount = (item.percentage / 100) * remainingAfterFixed;
                        categoryHtml += `<p>${item.name}: ${item.percentage}% (${itemAmount.toFixed(2)} บาท)</p>`;
                    }
                    categoryTotal += itemAmount;
                });
    
                categoryHtml += `<p><strong>รวม: ${categoryTotal.toFixed(2)} บาท</strong></p></div>`;
                summary.push(categoryHtml);
                chartData.push({ name: category.name, value: categoryTotal, color: category.color });
            });
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
            renderCategories();
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

    // เพิ่มฟังก์ชันใหม่สำหรับการบันทึกสถิติ
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
                <h3>${stat.monthName}</h3>
                <p>บันทึกเมื่อ: ${new Date(stat.date).toLocaleString()}</p>
                <button onclick="viewSavedStat(${index})">ดู</button>
                <button onclick="deleteSavedStat(${index})">ลบ</button>
            `;
            savedStatsList.appendChild(statElement);
        });
    }

    window.viewSavedStat = function(index) {
        const savedStats = JSON.parse(localStorage.getItem('savedStats') || '[]');
        const stat = savedStats[index];
        
        document.getElementById('summary').innerHTML = stat.summaryHTML;
        
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
                    }
                }
            }
        });
    };

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
renderCategories();
calculate();
renderSavedStatsList();
});