﻿/**
 * Created by Mahboob.M on 2/8/16
 */

define(["jquery", 'common/rivetsExtra', "jquery-ui", 'color-picker', 'ddslick'], function($, rv) {

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init( containerIDWithHash, _callback ) {

        require(['css!charts/indicators/stoch/stoch.css']);

        var Level = function (level, stroke, strokeWidth, dashStyle) {
            this.level = level;
            this.stroke = stroke;
            this.strokeWidth = strokeWidth;
            this.dashStyle = dashStyle;
        };
        var defaultLevels = [new Level(30, 'red', 1, 'Dash'), new Level(70, 'red', 1, 'Dash')];

        require(['text!charts/indicators/stochs/stochs.html', 'text!charts/indicators/indicators.json'], function ( $html, data ) {

            $html = $($html);
            $html.appendTo("body");

            data = JSON.parse(data);
            var current_indicator_data = data.stochs;
            var state = {
                "title": current_indicator_data.long_display_name,
                "description": current_indicator_data.description
            }
            rv.bind($html[0], state);

            $html.find("input[type='button']").button();

            $html.find("#stochs_k_stroke,#stochs_d_stroke").each(function () {
                $(this).colorpicker({
                    part: {
                        map: { size: 128 },
                        bar: { size: 128 }
                    },
                    select: function (event, color) {
                        $(this).css({
                            background: '#' + color.formatted
                        }).val('');
                        $(this).data("color", '#' + color.formatted);
                    },
                    ok: function (event, color) {
                        $(this).css({
                            background: '#' + color.formatted
                        }).val('');
                        $(this).data("color", '#' + color.formatted);
                    }
                });
            });

            $("#stochs_k_stroke").css("background", '#1c1010');
            $("#stochs_d_stroke").css("background", '#cd0a0a');

            var selectedDashStyle = "Solid";
            $('#stochs_dashStyle').ddslick({
                imagePosition: "left",
                width: 158,
                background: "white",
                onSelected: function (data) {
                    $('#stochs_dashStyle .dd-selected-image').css('max-width', '125px');
                    selectedDashStyle = data.selectedData.value
                }
            });
            $('#stochs_dashStyle .dd-option-image').css('max-width', '125px');


            var table = $html.find('#stochs_levels').DataTable({
                paging: false,
                scrollY: 100,
                autoWidth: true,
                searching: false,
                info: false,
                "columnDefs": [
                   { className: "dt-center", "targets": [0,1,2,3] },
                ],
                "aoColumnDefs": [{ "bSortable": false, "aTargets": [1, 3] }]

            });

            $.each(defaultLevels, function (index, value) {
                $(table.row.add([value.level, '<div style="background-color: ' + value.stroke + ';width:100%;height:20px;"></div>', value.strokeWidth,
                    '<div style="width:50px;overflow:hidden;"><img src="images/dashstyle/' + value.dashStyle + '.svg" /></div>']).draw().node())
                    .data("level", value)
                    .on('click', function () {
                        $(this).toggleClass('selected');
                    });
            });
            $html.find('#stochs_level_delete').click(function () {
                if (table.rows('.selected').indexes().length <= 0) {
                    require(["jquery", "jquery-growl"], function($) {
                        $.growl.error({ message: "Select level(s) to delete!" });
                    });
                } else {
                    table.rows('.selected').remove().draw();
                }
            });
            $html.find('#stochs_level_add').click(function () {
                require(["indicator_levels"], function(level) {
                    level.open(containerIDWithHash, function (levels) {
                        $.each(levels, function (ind, value) {
                            $(table.row.add([value.level, '<div style="background-color: ' + value.stroke + ';width:100%;height:20px;"></div>', value.strokeWidth,
                                '<div style="width:50px;overflow:hidden;"><img src="images/dashstyle/' + value.dashStyle + '.svg" /></div>']).draw().node())
                                .data("level", value)
                                .on('click', function () {
                                    $(this).toggleClass('selected');
                                } );
                        });
                    });
                });
            });

            $html.dialog({
                autoOpen: false,
                resizable: false,
                width: 450,
                modal: true,
                my: 'center',
                at: 'center',
                of: window,
                dialogClass: 'stochs-ui-dialog',
                buttons: [
                    {
                        text: "OK",
                        click: function () {
                            //Check validation
					        var isValid = true;
					        $(".stoch_input_width_for_period").each(function () {
					            var $elem = $(this);
                                if (!_.isInteger(_.toNumber($elem.val())) || !_.inRange($elem.val(), parseInt($elem.attr("min")), parseInt($elem.attr("max")) + 1)) {
					                require(["jquery", "jquery-growl"], function ($) {
					                    $.growl.error({
					                        message: "Only numbers between " + $elem.attr("min")
                                                    + " to " + $elem.attr("max")
                                                    + " is allowed for " + $elem.closest('tr').find('td:first').text() + "!"
					                    });
					                });
                                    $elem.val($elem.prop("defaultValue"));
					                isValid = false;
					                return;
					            }
					        });

					        if (!isValid) return;
                            var levels = [];
                            $.each(table.rows().nodes(), function () {
                                var data = $(this).data('level');
                                if (data) {
                                    levels.push({
                                        color: data.stroke,
                                        dashStyle: data.dashStyle,
                                        width: data.strokeWidth,
                                        value: data.level,
                                        label: {
                                            text: data.level
                                        }
                                    });
                                }
                            });

                            var options = {
                                fastKPeriod: parseInt($("#stochs_fast_k_period").val()),
                                slowKPeriod: parseInt($("#stochs_slow_k_period").val()),
                                slowDPeriod: parseInt($("#stochs_slow_d_period").val()),
                                fastKMaType: $("#stochs_fast_k_ma_type").val(),
                                slowKMaType: $("#stochs_slow_k_ma_type").val(),
                                slowDMaType: $("#stochs_slow_d_ma_type").val(),
                                stroke: $("#stochs_k_stroke").css("background-color"),
                                dStroke:$("#stochs_d_stroke").css("background-color"),
                                strokeWidth: parseInt($("#stochs_stroke_width").val()),
                                dashStyle: selectedDashStyle,
                                appliedTo: parseInt($("#stochs_applied_to").val()),
                                levels:levels
                            }
                            //Add STOCH for the main series
                            $($(".stochs").data('refererChartID')).highcharts().series[0].addIndicator('stochs', options);

                            closeDialog.call($html);

                        }
                    },
                    {
                        text: "Cancel",
                        click: function () {
                            closeDialog.call(this);
                        }
                    }
                ]
            });
            $html.find('select').selectmenu({
                width : 160
            });

            if (typeof _callback == "function")
            {
                _callback( containerIDWithHash );
            }

        });

    }

    return {

        open : function ( containerIDWithHash ) {

            if ($(".stochs").length == 0)
            {
                init( containerIDWithHash, this.open );
                return;
            }

            $(".stochs").data('refererChartID', containerIDWithHash).dialog( "open" );

        }

    };

});
