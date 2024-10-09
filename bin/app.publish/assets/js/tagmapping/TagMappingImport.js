let form = $(`#TagMappingImportForm`)
let table = $(`#TagMappingImportTable`)

// Class Definition
var TagMappingImportModify = function () {
    var _handleTagMappingImportForm = function () {
        let validation;

        // Init form validation rules. For more info check the FormValidation plugin's official documentation:https://formvalidation.io/
        validation = FormValidation.formValidation(
            KTUtil.getById('TagMappingImportForm'),
            {
                fields: {
                    GRNFile: {
                        validators: {
                            notEmpty: {
                                message: 'Please import file!',
                            },
                            file: {
                                extension: 'xls,xlsx',
                                type: 'application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                                message: 'The selected file is not valid (only excel)',
                            },
                        }
                    },
                  
                },
                plugins: {
                    trigger: new FormValidation.plugins.Trigger(),
                    submitButton: new FormValidation.plugins.SubmitButton(),
                    //defaultSubmit: new FormValidation.plugins.DefaultSubmit(), // Uncomment this line to enable normal button submit after form validation
                    bootstrap: new FormValidation.plugins.Bootstrap()
                }
            }
        );


        ///Read Excel file
        var ExcelToJSON = function () {

            this.parseExcel = function (file) {
                var reader = new FileReader();

                reader.onload = function (e) {
                    var data = e.target.result;
                    var workbook = XLSX.read(data, {
                        type: 'binary'
                    });
                    workbook.SheetNames.forEach(function (sheetName) {
                        // Here is your object
                        var XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
                        var json_object = JSON.stringify(XL_row_object);
                        console.log(JSON.parse(json_object));
                        ShowExcelTable(JSON.parse(json_object))
                    })
                };

                reader.onerror = function (ex) {
                    console.log(ex);
                };

                reader.readAsBinaryString(file);
            };
        };

        function handleFileSelect(evt) {

            var files = evt.target.files; // FileList object
            var xl2json = new ExcelToJSON();
            xl2json.parseExcel(files[0]);
        }

        $('#ImportFile').on('change', function (e) {
            let body = table.find('tbody')
            body.empty()
            $('#TagMappingImportBtn').hide()
            handleFileSelect(e)
        });

        function ShowExcelTable(ExcelArray) {
            let body = table.find('tbody')
          
            //Hiển thị dữ liệu trong bảng

            if (ExcelArray.length > 0) {
                $.each(ExcelArray, function (i, v) {
                 
                    let tr = `<tr class="table-row" data-epc="${v.EPC}">
                            <th scope="row">${i+1}</th>
                        
                            <td class="TagName">${v.TagName}</td>
                            <td class="EPC">${v.EPC}</td>
                            <td class="GRN"  contenteditable='true'></td>
                            
                            </tr>`

                    body.append(tr)
                   
                })
            }
            // Lấy tất cả các ô có thuộc tính contenteditable='true'
            var editableCells = document.querySelectorAll('[contenteditable=true]');

            // Lắng nghe sự kiện keydown trên mỗi ô chỉnh sửa
            editableCells.forEach(function (cell) {
                cell.addEventListener('keydown', function (event) {
                    // Kiểm tra xem phím được nhấn có phải là Enter không
                    if (event.keyCode === 13) {
                        // Ngăn chặn hành động mặc định của phím Enter (ngắt dòng)
                        event.preventDefault();

                        // Tìm ô tiếp theo trong cùng một hàng
                        var rowIndex = cell.parentElement.rowIndex-1;
                        var nextRow = cell.parentElement.parentElement.rows[rowIndex + 1];
                        var nextCell = nextRow ? nextRow.cells[cell.cellIndex] : null;

                        // Nếu có ô tiếp theo, đặt trạng thái chỉnh sửa và đưa con trỏ vào ô đó
                        if (nextCell) {
                            nextCell.focus();
                        }
                    }
                });
            });
        }

        $('#TagMappingImportBtn').on('click', function (e) {
            e.preventDefault();
            var result = validateRowsAndGetMappingTags();
            var mappingTags = result.mappingTags;
            var invalidRows = result.invalidRows;

            // Kiểm tra nếu có dòng không hợp lệ
            if (!invalidRows || mappingTags.length === 0) {
                swal.fire("GRNs are not valid!", "", "error")
            } else {
                Save(mappingTags)
            }

        });

        function Save(data) {
            // Gửi Ajax request đến action "Login"
            // Gọi controller với dữ liệu mappingTags
            $.ajax({
                url: 'TagMapping/MappingTags', // Đặt URL của controller ở đây
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(data),
                success: function (result) {
                    if (result.status) {
                        toastr.success(
                            'Mapped!',
                            'Success'
                        );
                        $('#TagMappingImportModal').modal('hide')
                        DataTagMappingTable()
                        $('#ImportFile').val('').trigger('change')
                    } else {
                        // Hiển thị thông báo lỗi
                        toastr.error(
                            result.message,
                            'Erorr'
                        );
                     
                    }
                },
                error: function (error) {
                    console.log('Lỗi:', error);
                }
            });
        }


    }
    // Public Functions
    return {
        // public functions
        init: function () {
            _handleTagMappingImportForm();
        }
    };
}();

jQuery(document).ready(function () {
    TagMappingImportModify.init();
   
    initRFIDCheck()
});
var btn
var btnStt = false
function initRFIDCheck() {
    btn = KTUtil.getById("RfidCheck");

    KTUtil.addEvent(btn, "click", function () {
        console.log(btnStt)
        btnStt = !btnStt
        if (btnStt) {
            
            KTUtil.btnWait(btn, "spinner spinner-right spinner-white pr-15", "Reading...");
            RFIDCheck()
        } else {
            StopCheck()
        }
        
    });
}
var startCheckInterval 
function RFIDCheck() {
    try {
        let id = $('#FXReadersSelect').val()
        var table = $('#TagMappingImportTable');
        let check= true
        if (id == '') {
            toastr.error(
                'Please select FXReader!',
                'Erorr'
            );
            StopCheck() 
            return;
        }
        if (table.find('td').length < 1) {
            toastr.error(
                'Selected file is invalid!',
                'Erorr'
            );
            StopCheck()
            return;
        }
       
        
        /* ClearOldTagCheck()*/
        clearInterval(startCheckInterval)
        startCheckInterval = setInterval(function () {
            
            ShowAllTagsCheck();
        }, 1000);
        startTimeout = setTimeout(() => {
            StopCheck()

        }, 10000)
        
        
    } catch (error) {
        console.log(error)
    }
}
function StopCheck() {
    clearInterval(startCheckInterval)
    KTUtil.btnRelease(btn);
    btnStt = false
}

function ShowAllTagsCheck() {
    try {
        let id = $('#FXReadersSelect').val()
        $.ajax({
            url: '/rfid/GetEPCForMapping',
            type: 'get',
            data: { id },
            success: function (data) {
                if (data.status) {
                    $.each(data.a, function (k, v) {
                        CheckGRNMapping(v.epc)
                    })

                    if (checkAllRowsGreen()) {
                        $('#TagMappingImportBtn').show()
                        swal.fire("All tags are valid!", "", "success")
                        StopCheck()
                    }
                } else {
                    toastr.error(
                        data.message,
                        'Erorr'
                    );
                    StopCheck()
                }
            },
        })
        
      
    } catch (error) {
        swal.fire(error.message, "", "error")
        StopCheck()
    }

}

function CheckGRNMapping(epc) {
    // Kiểm tra xem bảng có id TagMappingImportTable có tồn tại hay không
    var table = $('#TagMappingImportTable');

    // Nếu bảng tồn tại, tiến hành kiểm tra các dòng trong body của bảng
    if (table.length > 0) {
        // Tìm tất cả các dòng trong phần body của bảng
        var rows = table.find('tbody tr');

        // Duyệt qua từng dòng để kiểm tra thuộc tính data-epc
        rows.each(function () {
            var row = $(this);
            var rowEpc = row.data('epc'); // Lấy giá trị của data-epc

            // Nếu giá trị data-epc của dòng trùng với tham số epc, đổi màu dòng đó
            if (rowEpc === epc) {
                row.css('background-color', '#00801c6b');
            }
        });
    }
}

function checkAllRowsGreen() {
    var allGreen = true; // Giả định ban đầu là tất cả các dòng đều xanh

    // Kiểm tra xem bảng có id TagMappingImportTable có tồn tại hay không
    var table = $('#TagMappingImportTable');

    // Nếu bảng tồn tại, tiến hành kiểm tra các dòng trong body của bảng
    if (table.length > 0) {
        // Tìm tất cả các dòng trong phần body của bảng
        var rows = table.find('tbody tr');
        if (rows.length > 1) {
            // Duyệt qua từng dòng để kiểm tra màu nền
            rows.each(function () {
                var row = $(this);
                var bgColor = row.css('background-color');

                // Nếu màu nền của bất kỳ dòng nào không phải là màu xanh lá, thay đổi giá trị allGreen
                if (bgColor !== "rgba(0, 128, 28, 0.42)") {
                    allGreen = false;
                    return false; // Thoát vòng lặp each sớm nếu tìm thấy dòng không phải màu xanh
                }
            });
        } 
        
    }

    return allGreen;
}
function validateRowsAndGetMappingTags() {
    var mappingTags = [];
    var invalidRows = true;

    // Kiểm tra xem bảng có id TagMappingImportTable có tồn tại hay không
    var table = $('#TagMappingImportTable');

    // Nếu bảng tồn tại, tiến hành lấy dữ liệu EPC và GRN của từng dòng
    if (table.length > 0) {
        // Tìm tất cả các dòng trong phần body của bảng
        var rows = table.find('tbody tr');

        // Duyệt qua từng dòng để lấy dữ liệu
        rows.each(function () {
            var row = $(this);
            var epc = row.find('.EPC').text().trim(); // Lấy giá trị EPC từ cột có class EPC
            var grn = row.find('.GRN').text().trim(); // Lấy giá trị GRN từ cột có class GRN

            // Kiểm tra nếu GRN không có dữ liệu
            if (grn === '') {
                invalidRows = false
                row.find('.GRN').css('background-color', '#8000008c');
            } else {
                row.find('.GRN').css('background-color', '');
                // Tạo đối tượng GrnOfEpc và thêm vào mảng
                var grnOfEpc = {
                    EPC: epc,
                    GRN: grn,
                    MapDate: new Date() // Tạo MapDate là thời gian hiện tại
                };
                mappingTags.push(grnOfEpc);
            }
        });
    }

    return { mappingTags: mappingTags, invalidRows: invalidRows };
}




function ClearOldTagCheck() {
    let id = $('#FXReadersSelect').val()
    if (id != '') {
        $.ajax({
            url: '/rfid/DeleteEPCForMapping',
            type: 'post',
            data: { id },
            success: function (data) {
                if (data.code == 200) {

                }
            },
        })
    }
   
}