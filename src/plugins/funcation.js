export function formatDateToThai(dateString,time) {
    if(dateString == null || dateString == undefined){
        return '-'
    }
    const monthsThai = [
      "มกราคม",
      "กุมภาพันธ์",
      "มีนาคม",
      "เมษายน",
      "พฤษภาคม",
      "มิถุนายน",
      "กรกฎาคม",
      "สิงหาคม",
      "กันยายน",
      "ตุลาคม",
      "พฤศจิกายน",
      "ธันวาคม",
    ];
    
    const date = new Date(dateString);
    const day = date.getDate();
    const month = monthsThai[date.getMonth()];
    const year = date.getFullYear() + 543;
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    if(time){
        return `${day} ${month} ${year} เวลา ${hours}:${minutes} น.`;
    } else {
        return `${day} ${month} ${year}`;

    }
  }
  
  // ฟังก์ชันที่ใช้ในการแปลงวันที่เป็นรูปแบบสากล (DD/MM/YYYY)
  export function formatDateToInternational(dateString) {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  }
  
  // ฟังก์ชันที่ใช้ในการแปลงวันที่ให้แสดงเฉพาะปีพุทธศักราช
  export function formatYearToThaiBuddhist(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear() + 543;
    
    return `${year}`;
  }
  export function getTomorrowDate() {
    // ฟังก์ชันที่คำนวณวันถัดไป
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate());
    return tomorrow;
  }


  export function getNextYearDate() {
    // ฟังก์ชันที่คำนวณวันที่ 1 ปีถัดไป
    const today = new Date();
    const nextYear = new Date(today);
    nextYear.setFullYear(today.getFullYear() + 1); // เพิ่ม 1 ปี
    return nextYear;
  }

  export function formatSelectedTimeRange(selectedTime) {
    let formatSelectedTime = selectedTime
   console.log('formatSelectedTime',formatSelectedTime)
    switch (selectedTime) {
      case '8AM-10AM':
        formatSelectedTime = 'ช่วงเช้า 08:00 - 10:00 น.';
        break;
      case '10AM-12PM':
        formatSelectedTime = 'ช่วงเช้า 10:00 - 12:00 น.';
        break;
      case '1PM-3PM':
        formatSelectedTime = 'ช่วงบ่าย 13:00 - 15:00 น.';
        break;
      case '3PM-5PM':
        formatSelectedTime = 'ช่วงเย็น 15:00 - 17:00 น.';
        break;
      default:
        formatSelectedTime = ''; // Default value if no match
        break;
    }
   
    return formatSelectedTime;
  }

  export function convertTimeToThai(timeRange) {
    const timeParts = timeRange.match(/(\d{1,2})(AM|PM)-(\d{1,2})(AM|PM)/);
  
    if (timeParts) {
      let startHour = parseInt(timeParts[1]);
      let startPeriod = timeParts[2];
      let endHour = parseInt(timeParts[3]);
      let endPeriod = timeParts[4];
  
      // ปรับชั่วโมงสำหรับช่วงเวลา AM และ PM สำหรับเวลาเริ่มต้น
      if (startPeriod === "PM" && startHour !== 12) {
        startHour += 12;
      } else if (startPeriod === "AM" && startHour === 12) {
        startHour = 0;
      }
  
      // ปรับชั่วโมงสำหรับช่วงเวลา AM และ PM สำหรับเวลาสิ้นสุด
      if (endPeriod === "PM" && endHour !== 12) {
        endHour += 12;
      } else if (endPeriod === "AM" && endHour === 12) {
        endHour = 0;
      }
  
      // ฟอร์แมตให้เป็นเวลา 00:00
      const formattedStartHour = startHour.toString().padStart(2, '0') + ":00";
      const formattedEndHour = endHour.toString().padStart(2, '0') + ":00";
  
      return `${formattedStartHour} - ${formattedEndHour} น.`;
    }
  
    return "รูปแบบเวลาไม่ถูกต้อง";
  }

  //sai fix it
  // export function convertDateTimePostDataApi(dateTime) {
  //   const [date, time] = dateTime.split(' ');
  //   const [day, month, year] = date.split('-');
  //   const formattedDateTime = `${year}-${month}-${day} ${time}`;
  //   return formattedDateTime;
  // }
  
  export function convertDateTimePostDataApi(dateTime) {
    const [date, time] = dateTime.split(' ');
    const [day, month, year] = date.split('-');
    const completeTime = time.includes(':') && time.split(':').length === 2 ? `${time}:00` : time;
    const formattedDateTime = `${year}-${month}-${day} ${completeTime}`;
    return formattedDateTime;
  }
  