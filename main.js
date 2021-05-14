import 'regenerator-runtime/runtime';
import _ from 'lodash';
import './style.scss';

const pinCodes = prompt("PinCodes").split(",").map(code => {
    const pc = +code.trim();
    if(pc.toString().trim().length === 6 && !isNaN(pc) && Number.isInteger(pc)) {
        return pc
    }
}).filter(Boolean); // this is required

const weeks = () => {
    const weeksArr = [0,7,14,21,28];
    const weeksLength = prompt('How many weeks?', 3);
    weeksArr.length = +weeksLength > 4 ? 4 : weeksLength;
    return weeksArr;
}


const dates = weeks().map(item => {
    const dateObj = new Date(new Date().setDate(new Date().getDate() + item));
    return `${dateObj.getDate()}-${dateObj.getMonth() + 1}-${dateObj.getFullYear()}`;
})

const ifOnly45 = confirm('Press OK if looking for 45+ age group only. Cancel if looking for 18+ age group.') ? 45 : 18;
// const pinCodes = [110001, 110002]; // delete this

const vaccineData = (pinCode) => {
    return dates.map(async (date) => {
        const apiUrl = `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin?pincode=${pinCode}&date=${date}`;
        const fetchData = await fetch(apiUrl);
        const getFetchData = await fetchData.json();
        return await getFetchData;
    });
}

const fetchedVaccineDate = () => {
    return pinCodes.map(pinCode => {
        return vaccineData(pinCode)
    }).flat()
}

const finalCenters = () => {
    return Promise.all(fetchedVaccineDate()).then(res => {
        const centers = res.map(item => {
            return item?.centers.map(center => center)
        })
        return centers.flat();
    });
}

const availableSlots = () => {
    return finalCenters().then(res => {
        const slot = res.filter(item => {
            return item?.sessions.filter(session => {
                return session.available_capacity > 0 && session.min_age_limit >= ifOnly45;
            }).length !== 0; // set condition to !== 0
        }).flat();
    
        const finalAvSlot = _.cloneDeep(slot).filter(item => {
            const s = [...item.sessions];
            // console.log(item);
            const avSessions = s.filter(session => {
                // return session.date === '11-05-2021'; // delete this line
                return session.available_capacity > 0 && session.min_age_limit >= ifOnly45; // set this conditions
            });
            item.sessions = avSessions;
            if(item.sessions.length) {
                return item;
            }
        })
        return finalAvSlot.flat();
    });
}

const finalPrintObj = (inputObj) => {
    let finalHtml = '<div class="info-wrap">';

    inputObj.forEach(item => {
        finalHtml += '<ul class="info-card">';
        finalHtml += `<li><strong>Name:</strong> ${item.name}</li>`;
        finalHtml += `<li><strong>Address:</strong> ${item.address}</li>`;
        finalHtml += `<li><strong>Fee Type:</strong> ${item.fee_type}</li>`;
        finalHtml += `<li><strong>Time: </strong> ${item.from} to ${item.to}</li>`
        item.sessions.forEach(session => {
            finalHtml += '<hr>';
            finalHtml += `<li><strong>Date:</strong> ${session.date}</li>`;
            finalHtml += `<li><strong>Age Limit:</strong> ${session.min_age_limit}+</li>`;
            finalHtml += `<li><strong>Vaccine:</strong> ${session.vaccine}</li>`;
            finalHtml += `<li><strong>Available Capacity:</strong> ${session.available_capacity}</li>`;
            finalHtml += `<li class="slots">
                <div><strong>Slots:</strong></div>
                <div> ${session.slots.map(slot => `<p>${slot}</p>`).join('')}</div>
            </li>`;
        });
        finalHtml += '</ul>';
    })

    finalHtml += '</div>'

    return finalHtml;
}

const checkSlot = (interval) => {
    availableSlots().then(res => {
        console.log('Notification permission granted');
        console.log(res);
        if(res.length) {
            var options = {
                body: 'Vaccine Available!!',
                silent: false
            }
            const not = new Notification('Vaccine Available', options);
            not.onclick = () => {
                if(interval) clearInterval(interval)
                window.open('https://selfregistration.cowin.gov.in/');
            }
        }
        document.getElementById('body').innerHTML = finalPrintObj(res);
        console.log(res);
    });
}

// console.log(Notification.permission);
if(Notification.permission === 'granted') {
    checkSlot();
    let interval = setInterval(() => checkSlot(interval), 60000)
} else {
    Notification.requestPermission().then((permission) => {
        if(permission === 'granted') {
            checkSlot();
            let interval = setInterval(() => checkSlot(interval), 60000)
        }
    })
}

// if ('serviceWorker' in navigator) {
//     console.log('Service Worker and Push are supported');

//     navigator.serviceWorker.register('sw.js')
//         .then(function(swReg) {
//             console.log('Service Worker is registered');
//         })
//         .catch(function(error) {
//             console.error('Service Worker Error', error);
//         });
// } else {
//     console.warn('Push messaging is not supported');
// }

// Notification.requestPermission()
//     .then(result => {
//         if (result === 'granted') {
//             navigator.serviceWorker.ready.then(function(registration) {
//                 registration.showNotification('Vibration Sample', {
//                     body: 'Buzz! Buzz!',
//                     vibrate: [200, 100, 200, 100, 200, 100, 200],
//                     tag: 'vibration-sample'
//                 });
//             });
//         }
//     })
//     .catch(error => {
//         console.log(error);
//     })