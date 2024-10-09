let SuccesRecordData = debounce(function() {
    let setup = EquipmentSetupList.find((setup) => setup.Equipment_ID == $('#select_equipmentSetupSheets').val().split('|')[1]);
    const sheet = SetupSheet.map(item => {
        let stt = $(`#${item.RequiredPart}`).data('match')
        let grn = $(`#${item.RequiredPart} td.grn`).text().trim()
        return {
            PartNumber: item.RequiredPart,
            GRN: grn == "" ? null : grn,
            Status: stt
        };
    });
    var record = {
        RecordType: "Success",
        
        Owner: "",
        Machine: `${$('#select_machines  option:selected').text()}`,
        Assembly: `${$('#select_assembly  option:selected').text() }`,
        Setup: `${setup.SetupNumber}-${setup.ProgramName}`,
        
    };
    SaveRecord(record, sheet)
    
}, 300)

let FailRecordData = debounce(function () {
    let setup = EquipmentSetupList.find((setup) => setup.Equipment_ID == $('#select_equipmentSetupSheets').val().split('|')[1]);
    
    const sheet = SetupSheet.map(item => {
        let stt = $(`#${item.RequiredPart}`).data('match')
        let grn = $(`#${item.RequiredPart} td.grn`).text().trim()
        return {
            PartNumber: item.RequiredPart,
            GRN: grn == "" ? null:grn,
            Status: stt
        };
    });
    var record = {
        RecordType: "Fail",
        
        Owner: "Admin",
        Machine: `${$('#select_machines  option:selected').text()}`,
        Assembly: `${$('#select_assembly  option:selected').text() }`,
        Setup: `${setup.SetupNumber}-${setup.ProgramName}`,
        
    };
    SaveRecord(record, sheet)
    
},300)

let StopRecordData = debounce(function() {
    let setup = EquipmentSetupList.find((setup) => setup.Equipment_ID == $('#select_equipmentSetupSheets').val().split('|')[1]);
    
    var record = {
        RecordType: "Stop",
        Owner: "Admin",
        Machine: `${$('#select_machines  option:selected').text()}`,
        Assembly: `${$('#select_assembly  option:selected').text() }`,
        Setup: `${setup.SetupNumber}-${setup.ProgramName}`,
        
    };
    SaveRecord(record)
    
},300)


let SaveRecord = debounce((record, sheet) => {
    if (record.RecordType == "Success" || record.RecordType == "Fail") {
        let status = record.RecordType == "Success" ? "success" : "error"
        let title = record.RecordType == "Success" ? "Scan successful!" : "Scan fail!"
        Swal.fire({

            icon: status,
            title: title,
            showConfirmButton: false,
            timer: 1500
        }).then(() => {
            Save()
        });
    } else {
        Save()
    }

    function Save() {
        $.ajax({
            type: "POST",
            url: '/RFID/SaveRecord',
            data:
                JSON.stringify({ record: record, sheet: sheet }),

            contentType: "application/json; charset=utf-8",
            dataType: "json",

            success: function (result) {
                // Xử lý kết quả từ action
                if (result.Status) {
                    if (record.RecordType == "Success") {
                        clearInterval(startInterval)
                        clearInterval(startIntervalRefresh)
                        clearTimeout(startTimeout);
                        // Gọi hàm lưu Active GRNs
                        SaveActiveGRNs(record.RecordType, sheet);
                    } else if (record.RecordType == "Fail") {
                        clearInterval(startInterval)
                        clearInterval(startIntervalRefresh)
                       /* ChangeLight(true)*/
                    } else if (record.RecordType == "Stop") {
                        if (startInterval != null)
                            clearInterval(startInterval)
                        if (startIntervalRefresh != null)
                            clearInterval(startIntervalRefresh)

                        ClearSetupSheet()
                        ClearESS()
                    }
                    SetUpLight(record.RecordType);

                } else {
                    // Hiển thị thông báo lỗi
                    toastr.error(
                        result.Message,
                        'Erorr'
                    );
                    KTUtil.scrollTop();
                }
            },
            error: function () {
                // Xử lý lỗi khi gửi Ajax request
                toastr.error(
                    'Something wrong!',
                    'Erorr'
                );
                KTUtil.scrollTop();
            }
        });
    }
    
}, 300)
var canScan = true; // Biến toàn cục để kiểm tra trạng thái quét
function disableScanning() {
    // Ngăn không cho tiếp tục quét
    canScan = false; // Đặt biến trạng thái quét thành false
    clearInterval(startInterval);
    clearInterval(startIntervalRefresh);
    clearTimeout(startTimeout);
    DisableSetupSelect(false); // Cho phép chọn thiết bị lại
    
}
function turnOffWarningTemporarily(callback) {
    // Tắt đèn đỏ ở cổng 2
    $.ajax({
        type: "POST",
        url: "/RFID/SetUpLight",
        data: JSON.stringify({ port: 2, status: false }), // Tắt đèn đỏ ở cổng 2
        contentType: "application/json",
        dataType: "json",
        success: function () {
            console.log("Cảnh báo (đèn đỏ) đã tắt tạm thời.");

            // Bật đèn vàng ở cổng 3
            $.ajax({
                type: "POST",
                url: "/RFID/SetUpLight",
                data: JSON.stringify({ port: 3, status: true }), // Bật đèn vàng ở cổng 3
                contentType: "application/json",
                dataType: "json",
                success: function () {
                    console.log("Đèn vàng đã bật.");
                    // Gọi hàm để ngăn quét và cho phép chọn lại thiết bị
                    disableScanning();
                    window.location.reload();
                    // Nếu có callback, gọi nó sau khi tắt đèn đỏ và bật đèn vàng
                    if (callback) {
                        callback();
                    }
                },
                error: function (xhr, status, error) {
                    console.error("Lỗi xảy ra khi bật đèn vàng:", status, error);
                }
            });
        },
        error: function (xhr, status, error) {
            console.error("Lỗi xảy ra khi tắt đèn đỏ:", status, error);
        }
    });
}

function turnOnWarningAgain() {
    // Tắt đèn vàng ở cổng 3
    $.ajax({
        type: "POST",
        url: "/RFID/SetUpLight",
        data: JSON.stringify({ port: 3, status: false }), // Tắt đèn vàng ở cổng 3
        contentType: "application/json",
        dataType: "json",
        success: function () {
            console.log("Đèn vàng đã tắt.");

            // Bật lại đèn đỏ ở cổng 2
            $.ajax({
                type: "POST",
                url: "/RFID/SetUpLight",
                data: JSON.stringify({ port: 2, status: true }), // Bật đèn đỏ ở cổng 2
                contentType: "application/json",
                dataType: "json",
                success: function () {
                    console.log("Cảnh báo (đèn đỏ) đã bật lại do có lỗi.");
                    isWarningTurnedOff = false; // Đánh dấu rằng cảnh báo đã bật lại
                },
                error: function (xhr, status, error) {
                    console.error("Lỗi xảy ra khi bật đèn đỏ:", status, error);
                }
            });
        },
        error: function (xhr, status, error) {
            console.error("Lỗi xảy ra khi tắt đèn vàng:", status, error);
        }
    });
}

function handleScan(recordType) {
    if (isWarningTurnedOff && recordType === "Fail") {
        turnOnWarningAgain();
    } else {
        SetUpLight(recordType);
    }
}
$(document).ready(function () {
    var isWarningTurnedOff = false;

    // Xử lý sự kiện bấm nút tắt cảnh báo tạm thời
    $('#turnOffVolumeBtn').click(function () {
        turnOffWarningTemporarily(function () {
            isWarningTurnedOff = true; // Đánh dấu cảnh báo đã được tắt tạm thời
        });
    });

    // Hàm xử lý khi người dùng quét
    function onScan(recordType) {
        handleScan(recordType);
    }
});

function SaveActiveGRNs(recordType, sheet) {
    if (recordType === "Success") {
        $.ajax({
            type: "POST",
            url: '/RFID/SaveActiveGRNs',
            data: JSON.stringify({ sheet: sheet }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (result) {
                console.log("Response from SaveActiveGRNs:", result);
                if (result.Status) {
                    console.log("Active GRNs saved successfully.");
                } else {
                    toastr.error(result.Message, 'Error');
                }
            },
            error: function (xhr, status, error) {
                console.error("Error details:", xhr.status, status, error);
                toastr.error('Something went wrong while saving Active GRNs.', 'Error');
            }
        });
    }
}
// Hàm để tắt tất cả các đèn
function TurnOffAllLights(callback) {
    $.ajax({
        type: "POST",
        url: "/RFID/SetUpLight",
        data: JSON.stringify({ port: 1, status: false }),
        contentType: "application/json",
        dataType: "json",
        success: function () {
            $.ajax({
                type: "POST",
                url: "/RFID/SetUpLight",
                data: JSON.stringify({ port: 2, status: false }),
                contentType: "application/json",
                dataType: "json",
                success: function () {
                    $.ajax({
                        type: "POST",
                        url: "/RFID/SetUpLight",
                        data: JSON.stringify({ port: 3, status: false }),
                        contentType: "application/json",
                        dataType: "json",
                        success: function () {
                            if (callback) callback();
                        }
                    });
                }
            });
        }
    });
}

// Hàm để bật đèn mới
function SetUpLight(recordType) {
    var lightPort;
    var lightStatus = true; // Assuming we always want to turn on the light

    switch (recordType) {
        case "Success":
            lightPort = 1; // Cổng cho đèn xanh lá cây
            break;
        case "Fail":
            lightPort = 2; // Cổng cho đèn đỏ 
            break;
        case "Stop":
            lightPort = 3; // Cổng cho đèn vàng
            break;
        default:
            console.error("RecordType không hợp lệ.");
            return;
    }
    
    // Tắt tất cả các đèn trước khi bật đèn mới
    TurnOffAllLights(function () {
        // Bật đèn mới
        $.ajax({
            type: "POST",
            url: "/RFID/SetUpLight",
            data: JSON.stringify({ port: lightPort, status: lightStatus }),
            contentType: "application/json",
            dataType: "json",
        
            success: function (setupLightResult) {
                if (setupLightResult.status) {
                    var lightColor;
                    switch (lightPort) {
                        case 1:
                            lightColor = "green";
                            break;
                        case 2:
                            lightColor = "red";
                            break;
                        case 3:
                            lightColor = "yellow";
                            break;
                        default:
                            lightColor = "red";
                            break;
                    }
                    console.log(`Đèn ${lightColor} sáng thành công`);
                } else {
                    console.error("Lỗi khi thiết lập đèn: " + setupLightResult.message);
                }
            },
            error: function (xhr, status, error) {
                console.error("Lỗi xảy ra khi thiết lập đèn:", status, error);
            }
        });
    });
}

