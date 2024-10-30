"use strict";
// Class definition

var MEKTDatatable = function () {
	// Private functions

	// basic demo
	var demo = function () {

		var datatable = $('#kt_datatable_me').KTDatatable({
			// datasource definition
			data: {
				type: 'remote',
				source: {
					read: {
						url: '/TagMappingMe/GetListME',
					},
				},
				pageSize: 10, // display 20 records per page
				serverPaging: false,
				serverFiltering: false,
				serverSorting: false,
			},

			// layout definition
			layout: {
				scroll: false, // enable/disable datatable scroll both horizontal and vertical when needed.
				footer: false, // display/hide footer
			},

			// column sorting
			sortable: true,

			pagination: true,

			search: {
				input: $('#kt_datatable_search_query'),
				delay: 400,
				key: 'generalSearch'
			},

			// columns definition
			columns: [
				{
					field: 'STT',
					title: 'No.',
					sortable: 'asc',
					width: 50,
					type: 'number',
					selector: false,
					textAlign: 'center',
				}, {
					field: 'Name',
					title: 'ME GRN',
					width: 250,
					template: function (data) {
						var output = '<span class="font-weight-bold label-lg label-inline">' + data.Name + '</span>';
						return output;
					},
				}, {
					field: 'EPC',
					title: 'EPC',
					width: 250,
					template: function (data) {
						var output = '<span class="font-weight-bold label-lg label-inline">' + data.EPC + '</span>';
						return output;
					},
				}, {
					field: 'Status',
					title: 'Status',
					width: 250,
					// callback function support for column rendering
					template: function (row) {
						if (calculateTimeRemaining(row.MapDate)) {
							return '<span class="label font-weight-bold label-lg label-inline label-light-success" id="date' + row.Name + '">' + getTimeRemaining(row.MapDate, row.Name) +'</span>';
						} else {
							return '<span class="label font-weight-bold label-lg label-inline label-light-danger" id="date' + row.Name + '">Expired</span>';
						}
						
					},
				}],

		});

		datatable.on('datatable-on-layout-updated', function () {
			// Thực hiện các hành động bạn muốn ở đây
		});

		$('#kt_datatable_search_status').on('change', function () {
			datatable.search($(this).val().toLowerCase(), 'Status');
		});

		$('#kt_datatable_search_type').on('change', function () {
			datatable.search($(this).val().toLowerCase(), 'Type');
		});

		$('#kt_datatable_search_status, #kt_datatable_search_type').selectpicker();

	};

	return {
		// public functions
		init: function () {
			demo();
		},
	};
}();

jQuery(document).ready(function () {
	MEKTDatatable.init();
	$('#kt_datatable_me').KTDatatable().reload();
});

function calculateTimeRemaining(timestampStr) {
	var check = true;
	// Bước 1: Chuyển đổi timestamp về kiểu Date
	var timestamp = parseInt(timestampStr.match(/\d+/)[0]); // Lấy số timestamp từ chuỗi /Date(xxx)/
	var startTime = new Date(timestamp);

	// Bước 2: Tính thời gian hết hạn (12 tiếng sau thời gian bắt đầu)
	var expiryTime = new Date(startTime.getTime() + 12 * 60 * 60 * 1000); // Cộng thêm 12 tiếng (12 giờ * 60 phút * 60 giây * 1000 ms)

	var now = new Date(); // Lấy thời gian hiện tại
	var timeRemaining = expiryTime - now; // Thời gian còn lại (ms)

	if (timeRemaining <= 0) {
		check = false;
	}

	// Bước 3: Tính thời gian còn lại
	return check;
}

function getTimeRemaining(timestampStr, grn) {
	// Bước 1: Chuyển đổi timestamp về kiểu Date
	var timestamp = parseInt(timestampStr.match(/\d+/)[0]); // Lấy số timestamp từ chuỗi /Date(xxx)/
	var startTime = new Date(timestamp);

	// Bước 2: Tính thời gian hết hạn (12 tiếng sau thời gian bắt đầu)
	var expiryTime = new Date(startTime.getTime() + 12 * 60 * 60 * 1000); // Cộng thêm 12 tiếng (12 giờ * 60 phút * 60 giây * 1000 ms)

	function updateTimeRemaining() {
		var now = new Date(); // Lấy thời gian hiện tại
		var timeRemaining = expiryTime - now; // Thời gian còn lại (ms)

		if (timeRemaining <= 0) {
			console.log("Expired!"); // Nếu hết hạn
			$(`#date${grn}`).addClass("label-light-danger");
			$(`#date${grn}`).removeClass("label-light-success");
			$(`#date${grn}`).text("Expired");
			clearInterval(intervalId); // Dừng đếm ngược
			return;
		}

		// Chuyển đổi ms sang giờ, phút, giây
		var hours = Math.floor(timeRemaining / (1000 * 60 * 60));
		var minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
		var seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

		// Định dạng hh:mm:ss
		var formattedTime =
			(hours < 10 ? '0' : '') + hours + ":" +
			(minutes < 10 ? '0' : '') + minutes + ":" +
			(seconds < 10 ? '0' : '') + seconds;
		// Hiển thị thời gian còn lại
		$(`#date${grn}`).text((formattedTime));
	}

	// Bước 4: Cập nhật thời gian còn lại mỗi giây
	var intervalId = setInterval(updateTimeRemaining, 1000);
}
