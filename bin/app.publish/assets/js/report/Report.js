{
    "use strict";
    var page = 1;
    var isLoadingData = false;
    var isFull = false;
    
    let table = $(`#ReportsTable`)
    // Class Definition
  
    jQuery(document).ready(function () {
       

        ///Sự kiến cuộn bảng
        $('#Reports').scroll(function () {
            /* var element = $(this)[0];*/
            var scrollTop = $(this).scrollTop() + 3;
            var scrollHeight = $(this)[0].scrollHeight;
            var windowHeight = $(this).outerHeight();

            if (scrollTop + windowHeight >= scrollHeight && !isLoadingData && !isFull) {

               
                ScrollData(page);
                console.log(page)
            }
        });
        InitSearch()
       

    });
    var CurrentCusID = 0
   
    let InitSearch = () => {


        $('#ReportSearch').keypress((e) => {
            
            if (e.keyCode == 13) {
                DataReportTable()
            }

        })
        $('#search_report_Machine, #search_report_Assembly, #search_report_Setup, #search_report_Createby, #search_report_Status').on('change',function(e){
            DataReportTable()
        })
        initDaterange()
    }
    function InitCustomerSelect() {

        //GetDataList('/JabilAPI/GetListCustomer', ShowCustomerSelect)
        //GetDataList('/FXReader/GetFXList', ShowFXReaderSelect)
    }
   

    var DataReportTable = debounce(function () {
        page = 1
        table.find('tbody').empty()
        let search = $('#ReportSearch').val().trim()
        let daterange = $('input[name="daterange"]').val()
        let machine = $('#search_report_Machine').val()
        let assembly = $('#search_report_Assembly').val()
        let setup = $('#search_report_Setup').val()
        let createby = $('#search_report_Createby').val()
        let status = $('#search_report_Status').val()
        ReportsList = []
        ShowReportTable(page, search, daterange, machine, createby, setup, assembly, status)



    }, 300)
    function ScrollData(page) {

        let search = $('#ReportSearch').val().trim()
        let daterange = $('input[name="daterange"]').val()
        let machine = $('#search_report_Machine').val()
        let assembly = $('#search_report_Assembly').val()
        let setup = $('#search_report_Setup').val()
        let createby = $('#search_report_Createby').val()
        let status = $('#search_report_Status').val()
        ShowReportTable(page, search, daterange, machine, createby, setup, assembly, status)
    }

    function initUserRowClick($tr) {
        $tr.click(function () {
            let UserID = $(this).data('userid')
            GetUserDetail(UserID)
        })
    }

    var ReportsList = []
    var ShowReportTable = debounce(function (pagenumber, search, daterange, machine, createby, setup, assembly, status) {
        if (!isLoadingData) {
            let body = table.find('tbody')
            $.ajax({
                type: "GET",
                url: "/Report/GetReports",
                data: {
                    search,
                    page: pagenumber,
                    daterange,
                    machine,
                    createby,
                    setup,
                    assembly,
                    status
                },
                beforeSend: function () {
                    isLoadingData = true
                },
                datatype: 'json',
                success: function (data) {
                    if (data.Status) {
                        isFull = false
                        //Hiển thị dữ liệu trong bảng
                        
                        
                        if (data.data && data.data.length > 0) {
                            $.each(data.data, function (i, v) {

                                let tr = `<tr class="table-row" data-reportid ="${v.RecordID}">
                            
                            <th scope="row">
                              ${((10 * (data.pageCurrent - 1)) + (i + 1))}
                            </th>
                            <td>${v.Machine}</td>
                            <td>${v.Assembly}</td>
                            <td>${v.Setup}</td>
                            <td>${v.Owner}</td>
                            <td>${convertUnixTimeToString(v.Datetime)}</td>
                            <td>${v.RecordType}</td>
                            
                            </tr>`

                                body.append(tr)
                                initReportRowClick($(body.find('tr').last()))
                            })
                            pagenumber++
                            page = pagenumber

                            
                            isFull = data.to == data.total

                        }
                        table.parent().next().find('.dataTables_info').text(`Showing ${data.to} of ${data.total} records`)

                        ///Luu ds da lay de tim detail
                        if (ReportsList.length <= 0) {
                            ReportsList = data.data
                        } else {
                            ReportsList.push.apply(ReportsList, data.data)
                        }
                       
                    } else {
                        toastr.error(
                            response.Message,
                            'Erorr'
                        );
                    }
                    isLoadingData = false;

                },
                error: function () {
                    isLoadingData = false;
                }
            })
        }

    }, 300)

    function initReportRowClick($tr) {
        $tr.click(function () {
            let RecordID = $(this).data('reportid')
            ShowDetailReport(RecordID)
        })
    }
    let ShowDetailReport = debounce(function (RecordID) {
        let details = FindReportDetail(RecordID)
        $('#DetailReportsModal').modal()
        ShowDetailTable(details)
    },300)

    let FindReportDetail = function (RecordID) {
        var foundRecord = ReportsList.find(function (record) {
            return record.RecordID === RecordID ;
        });
        return foundRecord.RecordDatas
    }
    function ShowDetailTable(data) {
        let tableDetail = $(`#DetailReportsTable`)

        let bodyDetail = tableDetail.find('tbody')
        bodyDetail.empty()
        if (data && data.length > 0) {
            $.each(data, function (i, v) {

                let tr = `<tr class="table-row" >
                            
                            <th scope="row">
                              ${i + 1}
                            </th>
                            <td>${v.PartNumber}</td>
                            <td>${v.GRN}</td>
                            <td>${v.Status}</td>                            
                            </tr>`

                bodyDetail.append(tr)

            })          
        }
        tableDetail.parent().next().find('.dataTables_info').text(`Showing ${data.length} of ${data.length} records`)
    }
  
    function initDaterange() {
        $('input[name="daterange"]').daterangepicker({
            autoUpdateInput: false,
            timePicker: true,
            locale: {

                format: 'DD/MM/YY hh:mm A',
                cancelLabel: 'Clear',

            }

        });
        $('input[name="daterange"]').on('apply.daterangepicker', function (ev, picker) {
            $(this).val(picker.startDate.format('DD/MM/YYYY hh:mm A') + ' - ' + picker.endDate.format('DD/MM/YYYY hh:mm A'));
            DataReportTable()
        });
        $('input[name="daterange"]').on('change', function (ev, picker) {
            
            DataReportTable()
        });

        $('input[name="daterange"]').on('cancel.daterangepicker', function (ev, picker) {
            $(this).val('');
            DataReportTable()
        });
    }
    
}

