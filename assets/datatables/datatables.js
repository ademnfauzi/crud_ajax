/*
 * This combined file was created by the DataTables downloader builder:
 *   https://datatables.net/download
 *
 * To rebuild or modify this file with the latest versions of the included
 * software please visit:
 *   https://datatables.net/download/#bs4/fc-3.3.0/fh-3.1.6/r-2.2.3/sp-1.0.1
 *
 * Included libraries:
 *   FixedColumns 3.3.0, FixedHeader 3.1.6, Responsive 2.2.3, SearchPanes 1.0.1
 */

/*! FixedColumns 3.3.0
 * ©2010-2018 SpryMedia Ltd - datatables.net/license
 */

/**
 * @summary     FixedColumns
 * @description Freeze columns in place on a scrolling DataTable
 * @version     3.3.0
 * @file        dataTables.fixedColumns.js
 * @author      SpryMedia Ltd (www.sprymedia.co.uk)
 * @contact     www.sprymedia.co.uk/contact
 * @copyright   Copyright 2010-2018 SpryMedia Ltd.
 *
 * This source file is free software, available under the following license:
 *   MIT license - http://datatables.net/license/mit
 *
 * This source file is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the license files for details.
 *
 * For details please refer to: http://www.datatables.net
 */
(function( factory ){
	if ( typeof define === 'function' && define.amd ) {
		// AMD
		define( ['jquery', 'datatables.net'], function ( $ ) {
			return factory( $, window, document );
		} );
	}
	else if ( typeof exports === 'object' ) {
		// CommonJS
		module.exports = function (root, $) {
			if ( ! root ) {
				root = window;
			}

			if ( ! $ || ! $.fn.dataTable ) {
				$ = require('datatables.net')(root, $).$;
			}

			return factory( $, root, root.document );
		};
	}
	else {
		// Browser
		factory( jQuery, window, document );
	}
}(function( $, window, document, undefined ) {
'use strict';
var DataTable = $.fn.dataTable;
var _firefoxScroll;

/**
 * When making use of DataTables' x-axis scrolling feature, you may wish to
 * fix the left most column in place. This plug-in for DataTables provides
 * exactly this option (note for non-scrolling tables, please use the
 * FixedHeader plug-in, which can fix headers and footers). Key
 * features include:
 *
 * * Freezes the left or right most columns to the side of the table
 * * Option to freeze two or more columns
 * * Full integration with DataTables' scrolling options
 * * Speed - FixedColumns is fast in its operation
 *
 *  @class
 *  @constructor
 *  @global
 *  @param {object} dt DataTables instance. With DataTables 1.10 this can also
 *    be a jQuery collection, a jQuery selector, DataTables API instance or
 *    settings object.
 *  @param {object} [init={}] Configuration object for FixedColumns. Options are
 *    defined by {@link FixedColumns.defaults}
 *
 *  @requires jQuery 1.7+
 *  @requires DataTables 1.8.0+
 *
 *  @example
 *      var table = $('#example').dataTable( {
 *        "scrollX": "100%"
 *      } );
 *      new $.fn.dataTable.fixedColumns( table );
 */
var FixedColumns = function ( dt, init ) {
	var that = this;

	/* Sanity check - you just know it will happen */
	if ( ! ( this instanceof FixedColumns ) ) {
		alert( "FixedColumns warning: FixedColumns must be initialised with the 'new' keyword." );
		return;
	}

	if ( init === undefined || init === true ) {
		init = {};
	}

	// Use the DataTables Hungarian notation mapping method, if it exists to
	// provide forwards compatibility for camel case variables
	var camelToHungarian = $.fn.dataTable.camelToHungarian;
	if ( camelToHungarian ) {
		camelToHungarian( FixedColumns.defaults, FixedColumns.defaults, true );
		camelToHungarian( FixedColumns.defaults, init );
	}

	// v1.10 allows the settings object to be got form a number of sources
	var dtSettings = new $.fn.dataTable.Api( dt ).settings()[0];

	/**
	 * Settings object which contains customisable information for FixedColumns instance
	 * @namespace
	 * @extends FixedColumns.defaults
	 * @private
	 */
	this.s = {
		/**
		 * DataTables settings objects
		 *  @type     object
		 *  @default  Obtained from DataTables instance
		 */
		"dt": dtSettings,

		/**
		 * Number of columns in the DataTable - stored for quick access
		 *  @type     int
		 *  @default  Obtained from DataTables instance
		 */
		"iTableColumns": dtSettings.aoColumns.length,

		/**
		 * Original outer widths of the columns as rendered by DataTables - used to calculate
		 * the FixedColumns grid bounding box
		 *  @type     array.<int>
		 *  @default  []
		 */
		"aiOuterWidths": [],

		/**
		 * Original inner widths of the columns as rendered by DataTables - used to apply widths
		 * to the columns
		 *  @type     array.<int>
		 *  @default  []
		 */
		"aiInnerWidths": [],


		/**
		 * Is the document layout right-to-left
		 * @type boolean
		 */
		rtl: $(dtSettings.nTable).css('direction') === 'rtl'
	};


	/**
	 * DOM elements used by the class instance
	 * @namespace
	 * @private
	 *
	 */
	this.dom = {
		/**
		 * DataTables scrolling element
		 *  @type     node
		 *  @default  null
		 */
		"scroller": null,

		/**
		 * DataTables header table
		 *  @type     node
		 *  @default  null
		 */
		"header": null,

		/**
		 * DataTables body table
		 *  @type     node
		 *  @default  null
		 */
		"body": null,

		/**
		 * DataTables footer table
		 *  @type     node
		 *  @default  null
		 */
		"footer": null,

		/**
		 * Display grid elements
		 * @namespace
		 */
		"grid": {
			/**
			 * Grid wrapper. This is the container element for the 3x3 grid
			 *  @type     node
			 *  @default  null
			 */
			"wrapper": null,

			/**
			 * DataTables scrolling element. This element is the DataTables
			 * component in the display grid (making up the main table - i.e.
			 * not the fixed columns).
			 *  @type     node
			 *  @default  null
			 */
			"dt": null,

			/**
			 * Left fixed column grid components
			 * @namespace
			 */
			"left": {
				"wrapper": null,
				"head": null,
				"body": null,
				"foot": null
			},

			/**
			 * Right fixed column grid components
			 * @namespace
			 */
			"right": {
				"wrapper": null,
				"head": null,
				"body": null,
				"foot": null
			}
		},

		/**
		 * Cloned table nodes
		 * @namespace
		 */
		"clone": {
			/**
			 * Left column cloned table nodes
			 * @namespace
			 */
			"left": {
				/**
				 * Cloned header table
				 *  @type     node
				 *  @default  null
				 */
				"header": null,

				/**
				 * Cloned body table
				 *  @type     node
				 *  @default  null
				 */
				"body": null,

				/**
				 * Cloned footer table
				 *  @type     node
				 *  @default  null
				 */
				"footer": null
			},

			/**
			 * Right column cloned table nodes
			 * @namespace
			 */
			"right": {
				/**
				 * Cloned header table
				 *  @type     node
				 *  @default  null
				 */
				"header": null,

				/**
				 * Cloned body table
				 *  @type     node
				 *  @default  null
				 */
				"body": null,

				/**
				 * Cloned footer table
				 *  @type     node
				 *  @default  null
				 */
				"footer": null
			}
		}
	};

	if ( dtSettings._oFixedColumns ) {
		throw 'FixedColumns already initialised on this table';
	}

	/* Attach the instance to the DataTables instance so it can be accessed easily */
	dtSettings._oFixedColumns = this;

	/* Let's do it */
	if ( ! dtSettings._bInitComplete )
	{
		dtSettings.oApi._fnCallbackReg( dtSettings, 'aoInitComplete', function () {
			that._fnConstruct( init );
		}, 'FixedColumns' );
	}
	else
	{
		this._fnConstruct( init );
	}
};



$.extend( FixedColumns.prototype , {
	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Public methods
	 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

	/**
	 * Update the fixed columns - including headers and footers. Note that FixedColumns will
	 * automatically update the display whenever the host DataTable redraws.
	 *  @returns {void}
	 *  @example
	 *      var table = $('#example').dataTable( {
	 *          "scrollX": "100%"
	 *      } );
	 *      var fc = new $.fn.dataTable.fixedColumns( table );
	 *
	 *      // at some later point when the table has been manipulated....
	 *      fc.fnUpdate();
	 */
	"fnUpdate": function ()
	{
		this._fnDraw( true );
	},


	/**
	 * Recalculate the resizes of the 3x3 grid that FixedColumns uses for display of the table.
	 * This is useful if you update the width of the table container. Note that FixedColumns will
	 * perform this function automatically when the window.resize event is fired.
	 *  @returns {void}
	 *  @example
	 *      var table = $('#example').dataTable( {
	 *          "scrollX": "100%"
	 *      } );
	 *      var fc = new $.fn.dataTable.fixedColumns( table );
	 *
	 *      // Resize the table container and then have FixedColumns adjust its layout....
	 *      $('#content').width( 1200 );
	 *      fc.fnRedrawLayout();
	 */
	"fnRedrawLayout": function ()
	{
		this._fnColCalc();
		this._fnGridLayout();
		this.fnUpdate();
	},


	/**
	 * Mark a row such that it's height should be recalculated when using 'semiauto' row
	 * height matching. This function will have no effect when 'none' or 'auto' row height
	 * matching is used.
	 *  @param   {Node} nTr TR element that should have it's height recalculated
	 *  @returns {void}
	 *  @example
	 *      var table = $('#example').dataTable( {
	 *          "scrollX": "100%"
	 *      } );
	 *      var fc = new $.fn.dataTable.fixedColumns( table );
	 *
	 *      // manipulate the table - mark the row as needing an update then update the table
	 *      // this allows the redraw performed by DataTables fnUpdate to recalculate the row
	 *      // height
	 *      fc.fnRecalculateHeight();
	 *      table.fnUpdate( $('#example tbody tr:eq(0)')[0], ["insert date", 1, 2, 3 ... ]);
	 */
	"fnRecalculateHeight": function ( nTr )
	{
		delete nTr._DTTC_iHeight;
		nTr.style.height = 'auto';
	},


	/**
	 * Set the height of a given row - provides cross browser compatibility
	 *  @param   {Node} nTarget TR element that should have it's height recalculated
	 *  @param   {int} iHeight Height in pixels to set
	 *  @returns {void}
	 *  @example
	 *      var table = $('#example').dataTable( {
	 *          "scrollX": "100%"
	 *      } );
	 *      var fc = new $.fn.dataTable.fixedColumns( table );
	 *
	 *      // You may want to do this after manipulating a row in the fixed column
	 *      fc.fnSetRowHeight( $('#example tbody tr:eq(0)')[0], 50 );
	 */
	"fnSetRowHeight": function ( nTarget, iHeight )
	{
		nTarget.style.height = iHeight+"px";
	},


	/**
	 * Get data index information about a row or cell in the table body.
	 * This function is functionally identical to fnGetPosition in DataTables,
	 * taking the same parameter (TH, TD or TR node) and returning exactly the
	 * the same information (data index information). THe difference between
	 * the two is that this method takes into account the fixed columns in the
	 * table, so you can pass in nodes from the master table, or the cloned
	 * tables and get the index position for the data in the main table.
	 *  @param {node} node TR, TH or TD element to get the information about
	 *  @returns {int} If nNode is given as a TR, then a single index is 
	 *    returned, or if given as a cell, an array of [row index, column index
	 *    (visible), column index (all)] is given.
	 */
	"fnGetPosition": function ( node )
	{
		var idx;
		var inst = this.s.dt.oInstance;

		if ( ! $(node).parents('.DTFC_Cloned').length )
		{
			// Not in a cloned table
			return inst.fnGetPosition( node );
		}
		else
		{
			// Its in the cloned table, so need to look up position
			if ( node.nodeName.toLowerCase() === 'tr' ) {
				idx = $(node).index();
				return inst.fnGetPosition( $('tr', this.s.dt.nTBody)[ idx ] );
			}
			else
			{
				var colIdx = $(node).index();
				idx = $(node.parentNode).index();
				var row = inst.fnGetPosition( $('tr', this.s.dt.nTBody)[ idx ] );

				return [
					row,
					colIdx,
					inst.oApi._fnVisibleToColumnIndex( this.s.dt, colIdx )
				];
			}
		}
	},

	fnToFixedNode: function ( rowIdx, colIdx )
	{
		var found;

		if ( colIdx < this.s.iLeftColumns ) {
			found = $(this.dom.clone.left.body).find('[data-dt-row='+rowIdx+'][data-dt-column='+colIdx+']');
		}
		else if ( colIdx >= this.s.iRightColumns ) {
			found = $(this.dom.clone.right.body).find('[data-dt-row='+rowIdx+'][data-dt-column='+colIdx+']');
		}

		if ( found && found.length ) {
			return found[0];
		}

		// Fallback - non-fixed node
		var table = new $.fn.dataTable.Api(this.s.dt);
		return table.cell(rowIdx, colIdx).node();
	},


	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Private methods (they are of course public in JS, but recommended as private)
	 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

	/**
	 * Initialisation for FixedColumns
	 *  @param   {Object} oInit User settings for initialisation
	 *  @returns {void}
	 *  @private
	 */
	"_fnConstruct": function ( oInit )
	{
		var i, iLen, iWidth,
			that = this;

		/* Sanity checking */
		if ( typeof this.s.dt.oInstance.fnVersionCheck != 'function' ||
		     this.s.dt.oInstance.fnVersionCheck( '1.8.0' ) !== true )
		{
			alert( "FixedColumns "+FixedColumns.VERSION+" required DataTables 1.8.0 or later. "+
				"Please upgrade your DataTables installation" );
			return;
		}

		if ( this.s.dt.oScroll.sX === "" )
		{
			this.s.dt.oInstance.oApi._fnLog( this.s.dt, 1, "FixedColumns is not needed (no "+
				"x-scrolling in DataTables enabled), so no action will be taken. Use 'FixedHeader' for "+
				"column fixing when scrolling is not enabled" );
			return;
		}

		/* Apply the settings from the user / defaults */
		this.s = $.extend( true, this.s, FixedColumns.defaults, oInit );

		/* Set up the DOM as we need it and cache nodes */
		var classes = this.s.dt.oClasses;
		this.dom.grid.dt = $(this.s.dt.nTable).parents('div.'+classes.sScrollWrapper)[0];
		this.dom.scroller = $('div.'+classes.sScrollBody, this.dom.grid.dt )[0];

		/* Set up the DOM that we want for the fixed column layout grid */
		this._fnColCalc();
		this._fnGridSetup();

		/* Event handlers */
		var mouseController;
		var mouseDown = false;

		// When the mouse is down (drag scroll) the mouse controller cannot
		// change, as the browser keeps the original element as the scrolling one
		$(this.s.dt.nTableWrapper).on( 'mousedown.DTFC', function (e) {
			if ( e.button === 0 ) {
				mouseDown = true;

				$(document).one( 'mouseup', function () {
					mouseDown = false;
				} );
			}
		} );

		// When the body is scrolled - scroll the left and right columns
		$(this.dom.scroller)
			.on( 'mouseover.DTFC touchstart.DTFC', function () {
				if ( ! mouseDown ) {
					mouseController = 'main';
				}
			} )
			.on( 'scroll.DTFC', function (e) {
				if ( ! mouseController && e.originalEvent ) {
					mouseController = 'main';
				}

				if ( mouseController === 'main' ) {
					if ( that.s.iLeftColumns > 0 ) {
						that.dom.grid.left.liner.scrollTop = that.dom.scroller.scrollTop;
					}
					if ( that.s.iRightColumns > 0 ) {
						that.dom.grid.right.liner.scrollTop = that.dom.scroller.scrollTop;
					}
				}
			} );

		var wheelType = 'onwheel' in document.createElement('div') ?
			'wheel.DTFC' :
			'mousewheel.DTFC';

		if ( that.s.iLeftColumns > 0 ) {
			// When scrolling the left column, scroll the body and right column
			$(that.dom.grid.left.liner)
				.on( 'mouseover.DTFC touchstart.DTFC', function () {
					if ( ! mouseDown ) {
						mouseController = 'left';
					}
				} )
				.on( 'scroll.DTFC', function ( e ) {
					if ( ! mouseController && e.originalEvent ) {
						mouseController = 'left';
					}

					if ( mouseController === 'left' ) {
						that.dom.scroller.scrollTop = that.dom.grid.left.liner.scrollTop;
						if ( that.s.iRightColumns > 0 ) {
							that.dom.grid.right.liner.scrollTop = that.dom.grid.left.liner.scrollTop;
						}
					}
				} )
				.on( wheelType, function(e) {
					// Pass horizontal scrolling through
					var xDelta = e.type === 'wheel' ?
						-e.originalEvent.deltaX :
						e.originalEvent.wheelDeltaX;
					that.dom.scroller.scrollLeft -= xDelta;
				} );
		}

		if ( that.s.iRightColumns > 0 ) {
			// When scrolling the right column, scroll the body and the left column
			$(that.dom.grid.right.liner)
				.on( 'mouseover.DTFC touchstart.DTFC', function () {
					if ( ! mouseDown ) {
						mouseController = 'right';
					}
				} )
				.on( 'scroll.DTFC', function ( e ) {
					if ( ! mouseController && e.originalEvent ) {
						mouseController = 'right';
					}

					if ( mouseController === 'right' ) {
						that.dom.scroller.scrollTop = that.dom.grid.right.liner.scrollTop;
						if ( that.s.iLeftColumns > 0 ) {
							that.dom.grid.left.liner.scrollTop = that.dom.grid.right.liner.scrollTop;
						}
					}
				} )
				.on( wheelType, function(e) {
					// Pass horizontal scrolling through
					var xDelta = e.type === 'wheel' ?
						-e.originalEvent.deltaX :
						e.originalEvent.wheelDeltaX;
					that.dom.scroller.scrollLeft -= xDelta;
				} );
		}

		$(window).on( 'resize.DTFC', function () {
			that._fnGridLayout.call( that );
		} );

		var bFirstDraw = true;
		var jqTable = $(this.s.dt.nTable);

		jqTable
			.on( 'draw.dt.DTFC', function () {
				that._fnColCalc();
				that._fnDraw.call( that, bFirstDraw );
				bFirstDraw = false;
			} )
			.on( 'column-sizing.dt.DTFC', function () {
				that._fnColCalc();
				that._fnGridLayout( that );
			} )
			.on( 'column-visibility.dt.DTFC', function ( e, settings, column, vis, recalc ) {
				if ( recalc === undefined || recalc ) {
					that._fnColCalc();
					that._fnGridLayout( that );
					that._fnDraw( true );
				}
			} )
			.on( 'select.dt.DTFC deselect.dt.DTFC', function ( e, dt, type, indexes ) {
				if ( e.namespace === 'dt' ) {
					that._fnDraw( false );
				}
			} )
			.on( 'destroy.dt.DTFC', function () {
				jqTable.off( '.DTFC' );

				$(that.dom.scroller).off( '.DTFC' );
				$(window).off( '.DTFC' );
				$(that.s.dt.nTableWrapper).off( '.DTFC' );

				$(that.dom.grid.left.liner).off( '.DTFC '+wheelType );
				$(that.dom.grid.left.wrapper).remove();

				$(that.dom.grid.right.liner).off( '.DTFC '+wheelType );
				$(that.dom.grid.right.wrapper).remove();
			} );

		/* Get things right to start with - note that due to adjusting the columns, there must be
		 * another redraw of the main table. It doesn't need to be a full redraw however.
		 */
		this._fnGridLayout();
		this.s.dt.oInstance.fnDraw(false);
	},


	/**
	 * Calculate the column widths for the grid layout
	 *  @returns {void}
	 *  @private
	 */
	"_fnColCalc": function ()
	{
		var that = this;
		var iLeftWidth = 0;
		var iRightWidth = 0;

		this.s.aiInnerWidths = [];
		this.s.aiOuterWidths = [];

		$.each( this.s.dt.aoColumns, function (i, col) {
			var th = $(col.nTh);
			var border;

			if ( ! th.filter(':visible').length ) {
				that.s.aiInnerWidths.push( 0 );
				that.s.aiOuterWidths.push( 0 );
			}
			else
			{
				// Inner width is used to assign widths to cells
				// Outer width is used to calculate the container
				var iWidth = th.outerWidth();

				// When working with the left most-cell, need to add on the
				// table's border to the outerWidth, since we need to take
				// account of it, but it isn't in any cell
				if ( that.s.aiOuterWidths.length === 0 ) {
					border = $(that.s.dt.nTable).css('border-left-width');
					iWidth += typeof border === 'string' && border.indexOf('px') === -1 ?
						1 :
						parseInt( border, 10 );
				}

				// Likewise with the final column on the right
				if ( that.s.aiOuterWidths.length === that.s.dt.aoColumns.length-1 ) {
					border = $(that.s.dt.nTable).css('border-right-width');
					iWidth += typeof border === 'string' && border.indexOf('px') === -1 ?
						1 :
						parseInt( border, 10 );
				}

				that.s.aiOuterWidths.push( iWidth );
				that.s.aiInnerWidths.push( th.width() );

				if ( i < that.s.iLeftColumns )
				{
					iLeftWidth += iWidth;
				}

				if ( that.s.iTableColumns-that.s.iRightColumns <= i )
				{
					iRightWidth += iWidth;
				}
			}
		} );

		this.s.iLeftWidth = iLeftWidth;
		this.s.iRightWidth = iRightWidth;
	},


	/**
	 * Set up the DOM for the fixed column. The way the layout works is to create a 1x3 grid
	 * for the left column, the DataTable (for which we just reuse the scrolling element DataTable
	 * puts into the DOM) and the right column. In each of he two fixed column elements there is a
	 * grouping wrapper element and then a head, body and footer wrapper. In each of these we then
	 * place the cloned header, body or footer tables. This effectively gives as 3x3 grid structure.
	 *  @returns {void}
	 *  @private
	 */
	"_fnGridSetup": function ()
	{
		var that = this;
		var oOverflow = this._fnDTOverflow();
		var block;

		this.dom.body = this.s.dt.nTable;
		this.dom.header = this.s.dt.nTHead.parentNode;
		this.dom.header.parentNode.parentNode.style.position = "relative";

		var nSWrapper =
			$('<div class="DTFC_ScrollWrapper" style="position:relative; clear:both;">'+
				'<div class="DTFC_LeftWrapper" style="position:absolute; top:0; left:0;" aria-hidden="true">'+
					'<div class="DTFC_LeftHeadWrapper" style="position:relative; top:0; left:0; overflow:hidden;"></div>'+
					'<div class="DTFC_LeftBodyWrapper" style="position:relative; top:0; left:0; height:0; overflow:hidden;">'+
						'<div class="DTFC_LeftBodyLiner" style="position:relative; top:0; left:0; overflow-y:scroll;"></div>'+
					'</div>'+
					'<div class="DTFC_LeftFootWrapper" style="position:relative; top:0; left:0; overflow:hidden;"></div>'+
				'</div>'+
				'<div class="DTFC_RightWrapper" style="position:absolute; top:0; right:0;" aria-hidden="true">'+
					'<div class="DTFC_RightHeadWrapper" style="position:relative; top:0; left:0;">'+
						'<div class="DTFC_RightHeadBlocker DTFC_Blocker" style="position:absolute; top:0; bottom:0;"></div>'+
					'</div>'+
					'<div class="DTFC_RightBodyWrapper" style="position:relative; top:0; left:0; height:0; overflow:hidden;">'+
						'<div class="DTFC_RightBodyLiner" style="position:relative; top:0; left:0; overflow-y:scroll;"></div>'+
					'</div>'+
					'<div class="DTFC_RightFootWrapper" style="position:relative; top:0; left:0;">'+
						'<div class="DTFC_RightFootBlocker DTFC_Blocker" style="position:absolute; top:0; bottom:0;"></div>'+
					'</div>'+
				'</div>'+
			'</div>')[0];
		var nLeft = nSWrapper.childNodes[0];
		var nRight = nSWrapper.childNodes[1];

		this.dom.grid.dt.parentNode.insertBefore( nSWrapper, this.dom.grid.dt );
		nSWrapper.appendChild( this.dom.grid.dt );

		this.dom.grid.wrapper = nSWrapper;

		if ( this.s.iLeftColumns > 0 )
		{
			this.dom.grid.left.wrapper = nLeft;
			this.dom.grid.left.head = nLeft.childNodes[0];
			this.dom.grid.left.body = nLeft.childNodes[1];
			this.dom.grid.left.liner = $('div.DTFC_LeftBodyLiner', nSWrapper)[0];

			nSWrapper.appendChild( nLeft );
		}

		if ( this.s.iRightColumns > 0 )
		{
			this.dom.grid.right.wrapper = nRight;
			this.dom.grid.right.head = nRight.childNodes[0];
			this.dom.grid.right.body = nRight.childNodes[1];
			this.dom.grid.right.liner = $('div.DTFC_RightBodyLiner', nSWrapper)[0];

			nRight.style.right = oOverflow.bar+"px";

			block = $('div.DTFC_RightHeadBlocker', nSWrapper)[0];
			block.style.width = oOverflow.bar+"px";
			block.style.right = -oOverflow.bar+"px";
			this.dom.grid.right.headBlock = block;

			block = $('div.DTFC_RightFootBlocker', nSWrapper)[0];
			block.style.width = oOverflow.bar+"px";
			block.style.right = -oOverflow.bar+"px";
			this.dom.grid.right.footBlock = block;

			nSWrapper.appendChild( nRight );
		}

		if ( this.s.dt.nTFoot )
		{
			this.dom.footer = this.s.dt.nTFoot.parentNode;
			if ( this.s.iLeftColumns > 0 )
			{
				this.dom.grid.left.foot = nLeft.childNodes[2];
			}
			if ( this.s.iRightColumns > 0 )
			{
				this.dom.grid.right.foot = nRight.childNodes[2];
			}
		}

		// RTL support - swap the position of the left and right columns (#48)
		if ( this.s.rtl ) {
			$('div.DTFC_RightHeadBlocker', nSWrapper).css( {
				left: -oOverflow.bar+'px',
				right: ''
			} );
		}
	},


	/**
	 * Style and position the grid used for the FixedColumns layout
	 *  @returns {void}
	 *  @private
	 */
	"_fnGridLayout": function ()
	{
		var that = this;
		var oGrid = this.dom.grid;
		var iWidth = $(oGrid.wrapper).width();
		var iBodyHeight = this.s.dt.nTable.parentNode.offsetHeight;
		var iFullHeight = this.s.dt.nTable.parentNode.parentNode.offsetHeight;
		var oOverflow = this._fnDTOverflow();
		var iLeftWidth = this.s.iLeftWidth;
		var iRightWidth = this.s.iRightWidth;
		var rtl = $(this.dom.body).css('direction') === 'rtl';
		var wrapper;
		var scrollbarAdjust = function ( node, width ) {
			if ( ! oOverflow.bar ) {
				// If there is no scrollbar (Macs) we need to hide the auto scrollbar
				node.style.width = (width+20)+"px";
				node.style.paddingRight = "20px";
				node.style.boxSizing = "border-box";
			}
			else if ( that._firefoxScrollError() ) {
				// See the above function for why this is required
				if ( $(node).height() > 34 ) {
					node.style.width = (width+oOverflow.bar)+"px";
				}
			}
			else {
				// Otherwise just overflow by the scrollbar
				node.style.width = (width+oOverflow.bar)+"px";
			}
		};

		// When x scrolling - don't paint the fixed columns over the x scrollbar
		if ( oOverflow.x )
		{
			iBodyHeight -= oOverflow.bar;
		}

		oGrid.wrapper.style.height = iFullHeight+"px";

		if ( this.s.iLeftColumns > 0 )
		{
			wrapper = oGrid.left.wrapper;
			wrapper.style.width = iLeftWidth+'px';
			wrapper.style.height = '1px';

			// Swap the position of the left and right columns for rtl (#48)
			// This is always up against the edge, scrollbar on the far side
			if ( rtl ) {
				wrapper.style.left = '';
				wrapper.style.right = 0;
			}
			else {
				wrapper.style.left = 0;
				wrapper.style.right = '';
			}

			oGrid.left.body.style.height = iBodyHeight+"px";
			if ( oGrid.left.foot ) {
				oGrid.left.foot.style.top = (oOverflow.x ? oOverflow.bar : 0)+"px"; // shift footer for scrollbar
			}

			scrollbarAdjust( oGrid.left.liner, iLeftWidth );
			oGrid.left.liner.style.height = iBodyHeight+"px";
			oGrid.left.liner.style.maxHeight = iBodyHeight+"px";
		}

		if ( this.s.iRightColumns > 0 )
		{
			wrapper = oGrid.right.wrapper;
			wrapper.style.width = iRightWidth+'px';
			wrapper.style.height = '1px';

			// Need to take account of the vertical scrollbar
			if ( this.s.rtl ) {
				wrapper.style.left = oOverflow.y ? oOverflow.bar+'px' : 0;
				wrapper.style.right = '';
			}
			else {
				wrapper.style.left = '';
				wrapper.style.right = oOverflow.y ? oOverflow.bar+'px' : 0;
			}

			oGrid.right.body.style.height = iBodyHeight+"px";
			if ( oGrid.right.foot ) {
				oGrid.right.foot.style.top = (oOverflow.x ? oOverflow.bar : 0)+"px";
			}

			scrollbarAdjust( oGrid.right.liner, iRightWidth );
			oGrid.right.liner.style.height = iBodyHeight+"px";
			oGrid.right.liner.style.maxHeight = iBodyHeight+"px";

			oGrid.right.headBlock.style.display = oOverflow.y ? 'block' : 'none';
			oGrid.right.footBlock.style.display = oOverflow.y ? 'block' : 'none';
		}
	},


	/**
	 * Get information about the DataTable's scrolling state - specifically if the table is scrolling
	 * on either the x or y axis, and also the scrollbar width.
	 *  @returns {object} Information about the DataTables scrolling state with the properties:
	 *    'x', 'y' and 'bar'
	 *  @private
	 */
	"_fnDTOverflow": function ()
	{
		var nTable = this.s.dt.nTable;
		var nTableScrollBody = nTable.parentNode;
		var out = {
			"x": false,
			"y": false,
			"bar": this.s.dt.oScroll.iBarWidth
		};

		if ( nTable.offsetWidth > nTableScrollBody.clientWidth )
		{
			out.x = true;
		}

		if ( nTable.offsetHeight > nTableScrollBody.clientHeight )
		{
			out.y = true;
		}

		return out;
	},


	/**
	 * Clone and position the fixed columns
	 *  @returns {void}
	 *  @param   {Boolean} bAll Indicate if the header and footer should be updated as well (true)
	 *  @private
	 */
	"_fnDraw": function ( bAll )
	{
		this._fnGridLayout();
		this._fnCloneLeft( bAll );
		this._fnCloneRight( bAll );

		/* Draw callback function */
		if ( this.s.fnDrawCallback !== null )
		{
			this.s.fnDrawCallback.call( this, this.dom.clone.left, this.dom.clone.right );
		}

		/* Event triggering */
		$(this).trigger( 'draw.dtfc', {
			"leftClone": this.dom.clone.left,
			"rightClone": this.dom.clone.right
		} );
	},


	/**
	 * Clone the right columns
	 *  @returns {void}
	 *  @param   {Boolean} bAll Indicate if the header and footer should be updated as well (true)
	 *  @private
	 */
	"_fnCloneRight": function ( bAll )
	{
		if ( this.s.iRightColumns <= 0 ) {
			return;
		}

		var that = this,
			i, jq,
			aiColumns = [];

		for ( i=this.s.iTableColumns-this.s.iRightColumns ; i<this.s.iTableColumns ; i++ ) {
			if ( this.s.dt.aoColumns[i].bVisible ) {
				aiColumns.push( i );
			}
		}

		this._fnClone( this.dom.clone.right, this.dom.grid.right, aiColumns, bAll );
	},


	/**
	 * Clone the left columns
	 *  @returns {void}
	 *  @param   {Boolean} bAll Indicate if the header and footer should be updated as well (true)
	 *  @private
	 */
	"_fnCloneLeft": function ( bAll )
	{
		if ( this.s.iLeftColumns <= 0 ) {
			return;
		}

		var that = this,
			i, jq,
			aiColumns = [];

		for ( i=0 ; i<this.s.iLeftColumns ; i++ ) {
			if ( this.s.dt.aoColumns[i].bVisible ) {
				aiColumns.push( i );
			}
		}

		this._fnClone( this.dom.clone.left, this.dom.grid.left, aiColumns, bAll );
	},


	/**
	 * Make a copy of the layout object for a header or footer element from DataTables. Note that
	 * this method will clone the nodes in the layout object.
	 *  @returns {Array} Copy of the layout array
	 *  @param   {Object} aoOriginal Layout array from DataTables (aoHeader or aoFooter)
	 *  @param   {Object} aiColumns Columns to copy
	 *  @param   {boolean} events Copy cell events or not
	 *  @private
	 */
	"_fnCopyLayout": function ( aoOriginal, aiColumns, events )
	{
		var aReturn = [];
		var aClones = [];
		var aCloned = [];

		for ( var i=0, iLen=aoOriginal.length ; i<iLen ; i++ )
		{
			var aRow = [];
			aRow.nTr = $(aoOriginal[i].nTr).clone(events, false)[0];

			for ( var j=0, jLen=this.s.iTableColumns ; j<jLen ; j++ )
			{
				if ( $.inArray( j, aiColumns ) === -1 )
				{
					continue;
				}

				var iCloned = $.inArray( aoOriginal[i][j].cell, aCloned );
				if ( iCloned === -1 )
				{
					var nClone = $(aoOriginal[i][j].cell).clone(events, false)[0];
					aClones.push( nClone );
					aCloned.push( aoOriginal[i][j].cell );

					aRow.push( {
						"cell": nClone,
						"unique": aoOriginal[i][j].unique
					} );
				}
				else
				{
					aRow.push( {
						"cell": aClones[ iCloned ],
						"unique": aoOriginal[i][j].unique
					} );
				}
			}

			aReturn.push( aRow );
		}

		return aReturn;
	},


	/**
	 * Clone the DataTable nodes and place them in the DOM (sized correctly)
	 *  @returns {void}
	 *  @param   {Object} oClone Object containing the header, footer and body cloned DOM elements
	 *  @param   {Object} oGrid Grid object containing the display grid elements for the cloned
	 *                    column (left or right)
	 *  @param   {Array} aiColumns Column indexes which should be operated on from the DataTable
	 *  @param   {Boolean} bAll Indicate if the header and footer should be updated as well (true)
	 *  @private
	 */
	"_fnClone": function ( oClone, oGrid, aiColumns, bAll )
	{
		var that = this,
			i, iLen, j, jLen, jq, nTarget, iColumn, nClone, iIndex, aoCloneLayout,
			jqCloneThead, aoFixedHeader,
			dt = this.s.dt;

		/*
		 * Header
		 */
		if ( bAll )
		{
			$(oClone.header).remove();

			oClone.header = $(this.dom.header).clone(true, false)[0];
			oClone.header.className += " DTFC_Cloned";
			oClone.header.style.width = "100%";
			oGrid.head.appendChild( oClone.header );

			/* Copy the DataTables layout cache for the header for our floating column */
			aoCloneLayout = this._fnCopyLayout( dt.aoHeader, aiColumns, true );
			jqCloneThead = $('>thead', oClone.header);
			jqCloneThead.empty();

			/* Add the created cloned TR elements to the table */
			for ( i=0, iLen=aoCloneLayout.length ; i<iLen ; i++ )
			{
				jqCloneThead[0].appendChild( aoCloneLayout[i].nTr );
			}

			/* Use the handy _fnDrawHead function in DataTables to do the rowspan/colspan
			 * calculations for us
			 */
			dt.oApi._fnDrawHead( dt, aoCloneLayout, true );
		}
		else
		{
			/* To ensure that we copy cell classes exactly, regardless of colspan, multiple rows
			 * etc, we make a copy of the header from the DataTable again, but don't insert the
			 * cloned cells, just copy the classes across. To get the matching layout for the
			 * fixed component, we use the DataTables _fnDetectHeader method, allowing 1:1 mapping
			 */
			aoCloneLayout = this._fnCopyLayout( dt.aoHeader, aiColumns, false );
			aoFixedHeader=[];

			dt.oApi._fnDetectHeader( aoFixedHeader, $('>thead', oClone.header)[0] );

			for ( i=0, iLen=aoCloneLayout.length ; i<iLen ; i++ )
			{
				for ( j=0, jLen=aoCloneLayout[i].length ; j<jLen ; j++ )
				{
					aoFixedHeader[i][j].cell.className = aoCloneLayout[i][j].cell.className;

					// If jQuery UI theming is used we need to copy those elements as well
					$('span.DataTables_sort_icon', aoFixedHeader[i][j].cell).each( function () {
						this.className = $('span.DataTables_sort_icon', aoCloneLayout[i][j].cell)[0].className;
					} );
				}
			}
		}
		this._fnEqualiseHeights( 'thead', this.dom.header, oClone.header );

		/*
		 * Body
		 */
		if ( this.s.sHeightMatch == 'auto' )
		{
			/* Remove any heights which have been applied already and let the browser figure it out */
			$('>tbody>tr', that.dom.body).css('height', 'auto');
		}

		if ( oClone.body !== null )
		{
			$(oClone.body).remove();
			oClone.body = null;
		}

		oClone.body = $(this.dom.body).clone(true)[0];
		oClone.body.className += " DTFC_Cloned";
		oClone.body.style.paddingBottom = dt.oScroll.iBarWidth+"px";
		oClone.body.style.marginBottom = (dt.oScroll.iBarWidth*2)+"px"; /* For IE */
		if ( oClone.body.getAttribute('id') !== null )
		{
			oClone.body.removeAttribute('id');
		}

		$('>thead>tr', oClone.body).empty();
		$('>tfoot', oClone.body).remove();

		var nBody = $('tbody', oClone.body)[0];
		$(nBody).empty();
		if ( dt.aiDisplay.length > 0 )
		{
			/* Copy the DataTables' header elements to force the column width in exactly the
			 * same way that DataTables does it - have the header element, apply the width and
			 * colapse it down
			 */
			var nInnerThead = $('>thead>tr', oClone.body)[0];
			for ( iIndex=0 ; iIndex<aiColumns.length ; iIndex++ )
			{
				iColumn = aiColumns[iIndex];

				nClone = $(dt.aoColumns[iColumn].nTh).clone(true)[0];
				nClone.innerHTML = "";

				var oStyle = nClone.style;
				oStyle.paddingTop = "0";
				oStyle.paddingBottom = "0";
				oStyle.borderTopWidth = "0";
				oStyle.borderBottomWidth = "0";
				oStyle.height = 0;
				oStyle.width = that.s.aiInnerWidths[iColumn]+"px";

				nInnerThead.appendChild( nClone );
			}

			/* Add in the tbody elements, cloning form the master table */
			$('>tbody>tr', that.dom.body).each( function (z) {
				var i = that.s.dt.oFeatures.bServerSide===false ?
					that.s.dt.aiDisplay[ that.s.dt._iDisplayStart+z ] : z;
				var aTds = that.s.dt.aoData[ i ].anCells || $(this).children('td, th');

				var n = this.cloneNode(false);
				n.removeAttribute('id');
				n.setAttribute( 'data-dt-row', i );

				for ( iIndex=0 ; iIndex<aiColumns.length ; iIndex++ )
				{
					iColumn = aiColumns[iIndex];

					if ( aTds.length > 0 )
					{
						nClone = $( aTds[iColumn] ).clone(true, true)[0];
						nClone.removeAttribute( 'id' );
						nClone.setAttribute( 'data-dt-row', i );
						nClone.setAttribute( 'data-dt-column', iColumn );
						n.appendChild( nClone );
					}
				}
				nBody.appendChild( n );
			} );
		}
		else
		{
			$('>tbody>tr', that.dom.body).each( function (z) {
				nClone = this.cloneNode(true);
				nClone.className += ' DTFC_NoData';
				$('td', nClone).html('');
				nBody.appendChild( nClone );
			} );
		}

		oClone.body.style.width = "100%";
		oClone.body.style.margin = "0";
		oClone.body.style.padding = "0";

		// Interop with Scroller - need to use a height forcing element in the
		// scrolling area in the same way that Scroller does in the body scroll.
		if ( dt.oScroller !== undefined )
		{
			var scrollerForcer = dt.oScroller.dom.force;

			if ( ! oGrid.forcer ) {
				oGrid.forcer = scrollerForcer.cloneNode( true );
				oGrid.liner.appendChild( oGrid.forcer );
			}
			else {
				oGrid.forcer.style.height = scrollerForcer.style.height;
			}
		}

		oGrid.liner.appendChild( oClone.body );

		this._fnEqualiseHeights( 'tbody', that.dom.body, oClone.body );

		/*
		 * Footer
		 */
		if ( dt.nTFoot !== null )
		{
			if ( bAll )
			{
				if ( oClone.footer !== null )
				{
					oClone.footer.parentNode.removeChild( oClone.footer );
				}
				oClone.footer = $(this.dom.footer).clone(true, true)[0];
				oClone.footer.className += " DTFC_Cloned";
				oClone.footer.style.width = "100%";
				oGrid.foot.appendChild( oClone.footer );

				/* Copy the footer just like we do for the header */
				aoCloneLayout = this._fnCopyLayout( dt.aoFooter, aiColumns, true );
				var jqCloneTfoot = $('>tfoot', oClone.footer);
				jqCloneTfoot.empty();

				for ( i=0, iLen=aoCloneLayout.length ; i<iLen ; i++ )
				{
					jqCloneTfoot[0].appendChild( aoCloneLayout[i].nTr );
				}
				dt.oApi._fnDrawHead( dt, aoCloneLayout, true );
			}
			else
			{
				aoCloneLayout = this._fnCopyLayout( dt.aoFooter, aiColumns, false );
				var aoCurrFooter=[];

				dt.oApi._fnDetectHeader( aoCurrFooter, $('>tfoot', oClone.footer)[0] );

				for ( i=0, iLen=aoCloneLayout.length ; i<iLen ; i++ )
				{
					for ( j=0, jLen=aoCloneLayout[i].length ; j<jLen ; j++ )
					{
						aoCurrFooter[i][j].cell.className = aoCloneLayout[i][j].cell.className;
					}
				}
			}
			this._fnEqualiseHeights( 'tfoot', this.dom.footer, oClone.footer );
		}

		/* Equalise the column widths between the header footer and body - body get's priority */
		var anUnique = dt.oApi._fnGetUniqueThs( dt, $('>thead', oClone.header)[0] );
		$(anUnique).each( function (i) {
			iColumn = aiColumns[i];
			this.style.width = that.s.aiInnerWidths[iColumn]+"px";
		} );

		if ( that.s.dt.nTFoot !== null )
		{
			anUnique = dt.oApi._fnGetUniqueThs( dt, $('>tfoot', oClone.footer)[0] );
			$(anUnique).each( function (i) {
				iColumn = aiColumns[i];
				this.style.width = that.s.aiInnerWidths[iColumn]+"px";
			} );
		}
	},


	/**
	 * From a given table node (THEAD etc), get a list of TR direct child elements
	 *  @param   {Node} nIn Table element to search for TR elements (THEAD, TBODY or TFOOT element)
	 *  @returns {Array} List of TR elements found
	 *  @private
	 */
	"_fnGetTrNodes": function ( nIn )
	{
		var aOut = [];
		for ( var i=0, iLen=nIn.childNodes.length ; i<iLen ; i++ )
		{
			if ( nIn.childNodes[i].nodeName.toUpperCase() == "TR" )
			{
				aOut.push( nIn.childNodes[i] );
			}
		}
		return aOut;
	},


	/**
	 * Equalise the heights of the rows in a given table node in a cross browser way
	 *  @returns {void}
	 *  @param   {String} nodeName Node type - thead, tbody or tfoot
	 *  @param   {Node} original Original node to take the heights from
	 *  @param   {Node} clone Copy the heights to
	 *  @private
	 */
	"_fnEqualiseHeights": function ( nodeName, original, clone )
	{
		if ( this.s.sHeightMatch == 'none' && nodeName !== 'thead' && nodeName !== 'tfoot' )
		{
			return;
		}

		var that = this,
			i, iLen, iHeight, iHeight2, iHeightOriginal, iHeightClone,
			rootOriginal = original.getElementsByTagName(nodeName)[0],
			rootClone    = clone.getElementsByTagName(nodeName)[0],
			jqBoxHack    = $('>'+nodeName+'>tr:eq(0)', original).children(':first'),
			iBoxHack     = jqBoxHack.outerHeight() - jqBoxHack.height(),
			anOriginal   = this._fnGetTrNodes( rootOriginal ),
			anClone      = this._fnGetTrNodes( rootClone ),
			heights      = [];

		for ( i=0, iLen=anClone.length ; i<iLen ; i++ )
		{
			iHeightOriginal = anOriginal[i].offsetHeight;
			iHeightClone = anClone[i].offsetHeight;
			iHeight = iHeightClone > iHeightOriginal ? iHeightClone : iHeightOriginal;

			if ( this.s.sHeightMatch == 'semiauto' )
			{
				anOriginal[i]._DTTC_iHeight = iHeight;
			}

			heights.push( iHeight );
		}

		for ( i=0, iLen=anClone.length ; i<iLen ; i++ )
		{
			anClone[i].style.height = heights[i]+"px";
			anOriginal[i].style.height = heights[i]+"px";
		}
	},

	/**
	 * Determine if the UA suffers from Firefox's overflow:scroll scrollbars
	 * not being shown bug.
	 *
	 * Firefox doesn't draw scrollbars, even if it is told to using
	 * overflow:scroll, if the div is less than 34px height. See bugs 292284 and
	 * 781885. Using UA detection here since this is particularly hard to detect
	 * using objects - its a straight up rendering error in Firefox.
	 *
	 * @return {boolean} True if Firefox error is present, false otherwise
	 */
	_firefoxScrollError: function () {
		if ( _firefoxScroll === undefined ) {
			var test = $('<div/>')
				.css( {
					position: 'absolute',
					top: 0,
					left: 0,
					height: 10,
					width: 50,
					overflow: 'scroll'
				} )
				.appendTo( 'body' );

			// Make sure this doesn't apply on Macs with 0 width scrollbars
			_firefoxScroll = (
				test[0].clientWidth === test[0].offsetWidth && this._fnDTOverflow().bar !== 0
			);

			test.remove();
		}

		return _firefoxScroll;
	}
} );



/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Statics
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/**
 * FixedColumns default settings for initialisation
 *  @name FixedColumns.defaults
 *  @namespace
 *  @static
 */
FixedColumns.defaults = /** @lends FixedColumns.defaults */{
	/**
	 * Number of left hand columns to fix in position
	 *  @type     int
	 *  @default  1
	 *  @static
	 *  @example
	 *      var  = $('#example').dataTable( {
	 *          "scrollX": "100%"
	 *      } );
	 *      new $.fn.dataTable.fixedColumns( table, {
	 *          "leftColumns": 2
	 *      } );
	 */
	"iLeftColumns": 1,

	/**
	 * Number of right hand columns to fix in position
	 *  @type     int
	 *  @default  0
	 *  @static
	 *  @example
	 *      var table = $('#example').dataTable( {
	 *          "scrollX": "100%"
	 *      } );
	 *      new $.fn.dataTable.fixedColumns( table, {
	 *          "rightColumns": 1
	 *      } );
	 */
	"iRightColumns": 0,

	/**
	 * Draw callback function which is called when FixedColumns has redrawn the fixed assets
	 *  @type     function(object, object):void
	 *  @default  null
	 *  @static
	 *  @example
	 *      var table = $('#example').dataTable( {
	 *          "scrollX": "100%"
	 *      } );
	 *      new $.fn.dataTable.fixedColumns( table, {
	 *          "drawCallback": function () {
	 *	            alert( "FixedColumns redraw" );
	 *	        }
	 *      } );
	 */
	"fnDrawCallback": null,

	/**
	 * Height matching algorthim to use. This can be "none" which will result in no height
	 * matching being applied by FixedColumns (height matching could be forced by CSS in this
	 * case), "semiauto" whereby the height calculation will be performed once, and the result
	 * cached to be used again (fnRecalculateHeight can be used to force recalculation), or
	 * "auto" when height matching is performed on every draw (slowest but must accurate)
	 *  @type     string
	 *  @default  semiauto
	 *  @static
	 *  @example
	 *      var table = $('#example').dataTable( {
	 *          "scrollX": "100%"
	 *      } );
	 *      new $.fn.dataTable.fixedColumns( table, {
	 *          "heightMatch": "auto"
	 *      } );
	 */
	"sHeightMatch": "semiauto"
};




/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Constants
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/**
 * FixedColumns version
 *  @name      FixedColumns.version
 *  @type      String
 *  @default   See code
 *  @static
 */
FixedColumns.version = "3.3.0";



/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * DataTables API integration
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

DataTable.Api.register( 'fixedColumns()', function () {
	return this;
} );

DataTable.Api.register( 'fixedColumns().update()', function () {
	return this.iterator( 'table', function ( ctx ) {
		if ( ctx._oFixedColumns ) {
			ctx._oFixedColumns.fnUpdate();
		}
	} );
} );

DataTable.Api.register( 'fixedColumns().relayout()', function () {
	return this.iterator( 'table', function ( ctx ) {
		if ( ctx._oFixedColumns ) {
			ctx._oFixedColumns.fnRedrawLayout();
		}
	} );
} );

DataTable.Api.register( 'rows().recalcHeight()', function () {
	return this.iterator( 'row', function ( ctx, idx ) {
		if ( ctx._oFixedColumns ) {
			ctx._oFixedColumns.fnRecalculateHeight( this.row(idx).node() );
		}
	} );
} );

DataTable.Api.register( 'fixedColumns().rowIndex()', function ( row ) {
	row = $(row);

	return row.parents('.DTFC_Cloned').length ?
		this.rows( { page: 'current' } ).indexes()[ row.index() ] :
		this.row( row ).index();
} );

DataTable.Api.register( 'fixedColumns().cellIndex()', function ( cell ) {
	cell = $(cell);

	if ( cell.parents('.DTFC_Cloned').length ) {
		var rowClonedIdx = cell.parent().index();
		var rowIdx = this.rows( { page: 'current' } ).indexes()[ rowClonedIdx ];
		var columnIdx;

		if ( cell.parents('.DTFC_LeftWrapper').length ) {
			columnIdx = cell.index();
		}
		else {
			var columns = this.columns().flatten().length;
			columnIdx = columns - this.context[0]._oFixedColumns.s.iRightColumns + cell.index();
		}

		return {
			row: rowIdx,
			column: this.column.index( 'toData', columnIdx ),
			columnVisible: columnIdx
		};
	}
	else {
		return this.cell( cell ).index();
	}
} );

DataTable.Api.registerPlural( 'cells().fixedNodes()', 'cell().fixedNode()', function () {
	return this.iterator( 'cell', function ( settings, row, column ) {
		return settings._oFixedColumns
			? settings._oFixedColumns.fnToFixedNode( row, column )
			: this.node();
	}, 1 );
} );




/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Initialisation
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

// Attach a listener to the document which listens for DataTables initialisation
// events so we can automatically initialise
$(document).on( 'init.dt.fixedColumns', function (e, settings) {
	if ( e.namespace !== 'dt' ) {
		return;
	}

	var init = settings.oInit.fixedColumns;
	var defaults = DataTable.defaults.fixedColumns;

	if ( init || defaults ) {
		var opts = $.extend( {}, init, defaults );

		if ( init !== false ) {
			new FixedColumns( settings, opts );
		}
	}
} );



// Make FixedColumns accessible from the DataTables instance
$.fn.dataTable.FixedColumns = FixedColumns;
$.fn.DataTable.FixedColumns = FixedColumns;

return FixedColumns;
}));


/*! FixedHeader 3.1.6
 * ©2009-2019 SpryMedia Ltd - datatables.net/license
 */

/**
 * @summary     FixedHeader
 * @description Fix a table's header or footer, so it is always visible while
 *              scrolling
 * @version     3.1.6
 * @file        dataTables.fixedHeader.js
 * @author      SpryMedia Ltd (www.sprymedia.co.uk)
 * @contact     www.sprymedia.co.uk/contact
 * @copyright   Copyright 2009-2019 SpryMedia Ltd.
 *
 * This source file is free software, available under the following license:
 *   MIT license - http://datatables.net/license/mit
 *
 * This source file is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the license files for details.
 *
 * For details please refer to: http://www.datatables.net
 */

(function( factory ){
	if ( typeof define === 'function' && define.amd ) {
		// AMD
		define( ['jquery', 'datatables.net'], function ( $ ) {
			return factory( $, window, document );
		} );
	}
	else if ( typeof exports === 'object' ) {
		// CommonJS
		module.exports = function (root, $) {
			if ( ! root ) {
				root = window;
			}

			if ( ! $ || ! $.fn.dataTable ) {
				$ = require('datatables.net')(root, $).$;
			}

			return factory( $, root, root.document );
		};
	}
	else {
		// Browser
		factory( jQuery, window, document );
	}
}(function( $, window, document, undefined ) {
'use strict';
var DataTable = $.fn.dataTable;


var _instCounter = 0;

var FixedHeader = function ( dt, config ) {
	// Sanity check - you just know it will happen
	if ( ! (this instanceof FixedHeader) ) {
		throw "FixedHeader must be initialised with the 'new' keyword.";
	}

	// Allow a boolean true for defaults
	if ( config === true ) {
		config = {};
	}

	dt = new DataTable.Api( dt );

	this.c = $.extend( true, {}, FixedHeader.defaults, config );

	this.s = {
		dt: dt,
		position: {
			theadTop: 0,
			tbodyTop: 0,
			tfootTop: 0,
			tfootBottom: 0,
			width: 0,
			left: 0,
			tfootHeight: 0,
			theadHeight: 0,
			windowHeight: $(window).height(),
			visible: true
		},
		headerMode: null,
		footerMode: null,
		autoWidth: dt.settings()[0].oFeatures.bAutoWidth,
		namespace: '.dtfc'+(_instCounter++),
		scrollLeft: {
			header: -1,
			footer: -1
		},
		enable: true
	};

	this.dom = {
		floatingHeader: null,
		thead: $(dt.table().header()),
		tbody: $(dt.table().body()),
		tfoot: $(dt.table().footer()),
		header: {
			host: null,
			floating: null,
			placeholder: null
		},
		footer: {
			host: null,
			floating: null,
			placeholder: null
		}
	};

	this.dom.header.host = this.dom.thead.parent();
	this.dom.footer.host = this.dom.tfoot.parent();

	var dtSettings = dt.settings()[0];
	if ( dtSettings._fixedHeader ) {
		throw "FixedHeader already initialised on table "+dtSettings.nTable.id;
	}

	dtSettings._fixedHeader = this;

	this._constructor();
};


/*
 * Variable: FixedHeader
 * Purpose:  Prototype for FixedHeader
 * Scope:    global
 */
$.extend( FixedHeader.prototype, {
	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * API methods
	 */

	/**
	 * Kill off FH and any events
	 */
	destroy: function () {
		this.s.dt.off( '.dtfc' );
		$(window).off( this.s.namespace );

		if ( this.c.header ) {
			this._modeChange( 'in-place', 'header', true );
		}

		if ( this.c.footer && this.dom.tfoot.length ) {
			this._modeChange( 'in-place', 'footer', true );
		}
	},

	/**
	 * Enable / disable the fixed elements
	 *
	 * @param  {boolean} enable `true` to enable, `false` to disable
	 */
	enable: function ( enable, update )
	{
		this.s.enable = enable;

		if ( update || update === undefined ) {
			this._positions();
			this._scroll( true );
		}
	},

	/**
	 * Get enabled status
	 */
	enabled: function ()
	{
		return this.s.enable;
	},
	
	/**
	 * Set header offset 
	 *
	 * @param  {int} new value for headerOffset
	 */
	headerOffset: function ( offset )
	{
		if ( offset !== undefined ) {
			this.c.headerOffset = offset;
			this.update();
		}

		return this.c.headerOffset;
	},
	
	/**
	 * Set footer offset
	 *
	 * @param  {int} new value for footerOffset
	 */
	footerOffset: function ( offset )
	{
		if ( offset !== undefined ) {
			this.c.footerOffset = offset;
			this.update();
		}

		return this.c.footerOffset;
	},

	
	/**
	 * Recalculate the position of the fixed elements and force them into place
	 */
	update: function ()
	{
		var table = this.s.dt.table().node();

		if ( $(table).is(':visible') ) {
			this.enable( true, false );
		}
		else {
			this.enable( false, false );
		}

		this._positions();
		this._scroll( true );
	},


	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Constructor
	 */
	
	/**
	 * FixedHeader constructor - adding the required event listeners and
	 * simple initialisation
	 *
	 * @private
	 */
	_constructor: function ()
	{
		var that = this;
		var dt = this.s.dt;

		$(window)
			.on( 'scroll'+this.s.namespace, function () {
				that._scroll();
			} )
			.on( 'resize'+this.s.namespace, DataTable.util.throttle( function () {
				that.s.position.windowHeight = $(window).height();
				that.update();
			}, 50 ) );

		var autoHeader = $('.fh-fixedHeader');
		if ( ! this.c.headerOffset && autoHeader.length ) {
			this.c.headerOffset = autoHeader.outerHeight();
		}

		var autoFooter = $('.fh-fixedFooter');
		if ( ! this.c.footerOffset && autoFooter.length ) {
			this.c.footerOffset = autoFooter.outerHeight();
		}

		dt.on( 'column-reorder.dt.dtfc column-visibility.dt.dtfc draw.dt.dtfc column-sizing.dt.dtfc responsive-display.dt.dtfc', function () {
			that.update();
		} );

		dt.on( 'destroy.dtfc', function () {
			that.destroy();
		} );

		this._positions();
		this._scroll();
	},


	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Private methods
	 */

	/**
	 * Clone a fixed item to act as a place holder for the original element
	 * which is moved into a clone of the table element, and moved around the
	 * document to give the fixed effect.
	 *
	 * @param  {string}  item  'header' or 'footer'
	 * @param  {boolean} force Force the clone to happen, or allow automatic
	 *   decision (reuse existing if available)
	 * @private
	 */
	_clone: function ( item, force )
	{
		var dt = this.s.dt;
		var itemDom = this.dom[ item ];
		var itemElement = item === 'header' ?
			this.dom.thead :
			this.dom.tfoot;

		if ( ! force && itemDom.floating ) {
			// existing floating element - reuse it
			itemDom.floating.removeClass( 'fixedHeader-floating fixedHeader-locked' );
		}
		else {
			if ( itemDom.floating ) {
				itemDom.placeholder.remove();
				this._unsize( item );
				itemDom.floating.children().detach();
				itemDom.floating.remove();
			}

			itemDom.floating = $( dt.table().node().cloneNode( false ) )
				.css( 'table-layout', 'fixed' )
				.attr( 'aria-hidden', 'true' )
				.removeAttr( 'id' )
				.append( itemElement )
				.appendTo( 'body' );

			// Insert a fake thead/tfoot into the DataTable to stop it jumping around
			itemDom.placeholder = itemElement.clone( false );
			itemDom.placeholder
				.find( '*[id]' )
				.removeAttr( 'id' );

			itemDom.host.prepend( itemDom.placeholder );

			// Clone widths
			this._matchWidths( itemDom.placeholder, itemDom.floating );
		}
	},

	/**
	 * Copy widths from the cells in one element to another. This is required
	 * for the footer as the footer in the main table takes its sizes from the
	 * header columns. That isn't present in the footer so to have it still
	 * align correctly, the sizes need to be copied over. It is also required
	 * for the header when auto width is not enabled
	 *
	 * @param  {jQuery} from Copy widths from
	 * @param  {jQuery} to   Copy widths to
	 * @private
	 */
	_matchWidths: function ( from, to ) {
		var get = function ( name ) {
			return $(name, from)
				.map( function () {
					return $(this).width();
				} ).toArray();
		};

		var set = function ( name, toWidths ) {
			$(name, to).each( function ( i ) {
				$(this).css( {
					width: toWidths[i],
					minWidth: toWidths[i]
				} );
			} );
		};

		var thWidths = get( 'th' );
		var tdWidths = get( 'td' );

		set( 'th', thWidths );
		set( 'td', tdWidths );
	},

	/**
	 * Remove assigned widths from the cells in an element. This is required
	 * when inserting the footer back into the main table so the size is defined
	 * by the header columns and also when auto width is disabled in the
	 * DataTable.
	 *
	 * @param  {string} item The `header` or `footer`
	 * @private
	 */
	_unsize: function ( item ) {
		var el = this.dom[ item ].floating;

		if ( el && (item === 'footer' || (item === 'header' && ! this.s.autoWidth)) ) {
			$('th, td', el).css( {
				width: '',
				minWidth: ''
			} );
		}
		else if ( el && item === 'header' ) {
			$('th, td', el).css( 'min-width', '' );
		}
	},

	/**
	 * Reposition the floating elements to take account of horizontal page
	 * scroll
	 *
	 * @param  {string} item       The `header` or `footer`
	 * @param  {int}    scrollLeft Document scrollLeft
	 * @private
	 */
	_horizontal: function ( item, scrollLeft )
	{
		var itemDom = this.dom[ item ];
		var position = this.s.position;
		var lastScrollLeft = this.s.scrollLeft;

		if ( itemDom.floating && lastScrollLeft[ item ] !== scrollLeft ) {
			itemDom.floating.css( 'left', position.left - scrollLeft );

			lastScrollLeft[ item ] = scrollLeft;
		}
	},

	/**
	 * Change from one display mode to another. Each fixed item can be in one
	 * of:
	 *
	 * * `in-place` - In the main DataTable
	 * * `in` - Floating over the DataTable
	 * * `below` - (Header only) Fixed to the bottom of the table body
	 * * `above` - (Footer only) Fixed to the top of the table body
	 * 
	 * @param  {string}  mode        Mode that the item should be shown in
	 * @param  {string}  item        'header' or 'footer'
	 * @param  {boolean} forceChange Force a redraw of the mode, even if already
	 *     in that mode.
	 * @private
	 */
	_modeChange: function ( mode, item, forceChange )
	{
		var dt = this.s.dt;
		var itemDom = this.dom[ item ];
		var position = this.s.position;

		// Record focus. Browser's will cause input elements to loose focus if
		// they are inserted else where in the doc
		var tablePart = this.dom[ item==='footer' ? 'tfoot' : 'thead' ];
		var focus = $.contains( tablePart[0], document.activeElement ) ?
			document.activeElement :
			null;
		
		if ( focus ) {
			focus.blur();
		}

		if ( mode === 'in-place' ) {
			// Insert the header back into the table's real header
			if ( itemDom.placeholder ) {
				itemDom.placeholder.remove();
				itemDom.placeholder = null;
			}

			this._unsize( item );

			if ( item === 'header' ) {
				itemDom.host.prepend( tablePart );
			}
			else {
				itemDom.host.append( tablePart );
			}

			if ( itemDom.floating ) {
				itemDom.floating.remove();
				itemDom.floating = null;
			}
		}
		else if ( mode === 'in' ) {
			// Remove the header from the read header and insert into a fixed
			// positioned floating table clone
			this._clone( item, forceChange );

			itemDom.floating
				.addClass( 'fixedHeader-floating' )
				.css( item === 'header' ? 'top' : 'bottom', this.c[item+'Offset'] )
				.css( 'left', position.left+'px' )
				.css( 'width', position.width+'px' );

			if ( item === 'footer' ) {
				itemDom.floating.css( 'top', '' );
			}
		}
		else if ( mode === 'below' ) { // only used for the header
			// Fix the position of the floating header at base of the table body
			this._clone( item, forceChange );

			itemDom.floating
				.addClass( 'fixedHeader-locked' )
				.css( 'top', position.tfootTop - position.theadHeight )
				.css( 'left', position.left+'px' )
				.css( 'width', position.width+'px' );
		}
		else if ( mode === 'above' ) { // only used for the footer
			// Fix the position of the floating footer at top of the table body
			this._clone( item, forceChange );

			itemDom.floating
				.addClass( 'fixedHeader-locked' )
				.css( 'top', position.tbodyTop )
				.css( 'left', position.left+'px' )
				.css( 'width', position.width+'px' );
		}

		// Restore focus if it was lost
		if ( focus && focus !== document.activeElement ) {
			setTimeout( function () {
				focus.focus();
			}, 10 );
		}

		this.s.scrollLeft.header = -1;
		this.s.scrollLeft.footer = -1;
		this.s[item+'Mode'] = mode;
	},

	/**
	 * Cache the positional information that is required for the mode
	 * calculations that FixedHeader performs.
	 *
	 * @private
	 */
	_positions: function ()
	{
		var dt = this.s.dt;
		var table = dt.table();
		var position = this.s.position;
		var dom = this.dom;
		var tableNode = $(table.node());

		// Need to use the header and footer that are in the main table,
		// regardless of if they are clones, since they hold the positions we
		// want to measure from
		var thead = tableNode.children('thead');
		var tfoot = tableNode.children('tfoot');
		var tbody = dom.tbody;

		position.visible = tableNode.is(':visible');
		position.width = tableNode.outerWidth();
		position.left = tableNode.offset().left;
		position.theadTop = thead.offset().top;
		position.tbodyTop = tbody.offset().top;
		position.tbodyHeight = tbody.outerHeight();
		position.theadHeight = position.tbodyTop - position.theadTop;

		if ( tfoot.length ) {
			position.tfootTop = tfoot.offset().top;
			position.tfootBottom = position.tfootTop + tfoot.outerHeight();
			position.tfootHeight = position.tfootBottom - position.tfootTop;
		}
		else {
			position.tfootTop = position.tbodyTop + tbody.outerHeight();
			position.tfootBottom = position.tfootTop;
			position.tfootHeight = position.tfootTop;
		}
	},


	/**
	 * Mode calculation - determine what mode the fixed items should be placed
	 * into.
	 *
	 * @param  {boolean} forceChange Force a redraw of the mode, even if already
	 *     in that mode.
	 * @private
	 */
	_scroll: function ( forceChange )
	{
		var windowTop = $(document).scrollTop();
		var windowLeft = $(document).scrollLeft();
		var position = this.s.position;
		var headerMode, footerMode;

		if ( this.c.header ) {
			if ( ! this.s.enable ) {
				headerMode = 'in-place';
			}
			else if ( ! position.visible || windowTop <= position.theadTop - this.c.headerOffset ) {
				headerMode = 'in-place';
			}
			else if ( windowTop <= position.tfootTop - position.theadHeight - this.c.headerOffset ) {
				headerMode = 'in';
			}
			else {
				headerMode = 'below';
			}

			if ( forceChange || headerMode !== this.s.headerMode ) {
				this._modeChange( headerMode, 'header', forceChange );
			}

			this._horizontal( 'header', windowLeft );
		}

		if ( this.c.footer && this.dom.tfoot.length ) {
			if ( ! this.s.enable ) {
				headerMode = 'in-place';
			}
			else if ( ! position.visible || windowTop + position.windowHeight >= position.tfootBottom + this.c.footerOffset ) {
				footerMode = 'in-place';
			}
			else if ( position.windowHeight + windowTop > position.tbodyTop + position.tfootHeight + this.c.footerOffset ) {
				footerMode = 'in';
			}
			else {
				footerMode = 'above';
			}

			if ( forceChange || footerMode !== this.s.footerMode ) {
				this._modeChange( footerMode, 'footer', forceChange );
			}

			this._horizontal( 'footer', windowLeft );
		}
	}
} );


/**
 * Version
 * @type {String}
 * @static
 */
FixedHeader.version = "3.1.6";

/**
 * Defaults
 * @type {Object}
 * @static
 */
FixedHeader.defaults = {
	header: true,
	footer: false,
	headerOffset: 0,
	footerOffset: 0
};


/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * DataTables interfaces
 */

// Attach for constructor access
$.fn.dataTable.FixedHeader = FixedHeader;
$.fn.DataTable.FixedHeader = FixedHeader;


// DataTables creation - check if the FixedHeader option has been defined on the
// table and if so, initialise
$(document).on( 'init.dt.dtfh', function (e, settings, json) {
	if ( e.namespace !== 'dt' ) {
		return;
	}

	var init = settings.oInit.fixedHeader;
	var defaults = DataTable.defaults.fixedHeader;

	if ( (init || defaults) && ! settings._fixedHeader ) {
		var opts = $.extend( {}, defaults, init );

		if ( init !== false ) {
			new FixedHeader( settings, opts );
		}
	}
} );

// DataTables API methods
DataTable.Api.register( 'fixedHeader()', function () {} );

DataTable.Api.register( 'fixedHeader.adjust()', function () {
	return this.iterator( 'table', function ( ctx ) {
		var fh = ctx._fixedHeader;

		if ( fh ) {
			fh.update();
		}
	} );
} );

DataTable.Api.register( 'fixedHeader.enable()', function ( flag ) {
	return this.iterator( 'table', function ( ctx ) {
		var fh = ctx._fixedHeader;

		flag = ( flag !== undefined ? flag : true );
		if ( fh && flag !== fh.enabled() ) {
			fh.enable( flag );
		}
	} );
} );

DataTable.Api.register( 'fixedHeader.enabled()', function () {
	if ( this.context.length ) {
		var fx = this.content[0]._fixedHeader;

		if ( fh ) {
			return fh.enabled();
		}
	}

	return false;
} );

DataTable.Api.register( 'fixedHeader.disable()', function ( ) {
	return this.iterator( 'table', function ( ctx ) {
		var fh = ctx._fixedHeader;

		if ( fh && fh.enabled() ) {
			fh.enable( false );
		}
	} );
} );

$.each( ['header', 'footer'], function ( i, el ) {
	DataTable.Api.register( 'fixedHeader.'+el+'Offset()', function ( offset ) {
		var ctx = this.context;

		if ( offset === undefined ) {
			return ctx.length && ctx[0]._fixedHeader ?
				ctx[0]._fixedHeader[el +'Offset']() :
				undefined;
		}

		return this.iterator( 'table', function ( ctx ) {
			var fh = ctx._fixedHeader;

			if ( fh ) {
				fh[ el +'Offset' ]( offset );
			}
		} );
	} );
} );


return FixedHeader;
}));


/*! Responsive 2.2.3
 * 2014-2018 SpryMedia Ltd - datatables.net/license
 */

/**
 * @summary     Responsive
 * @description Responsive tables plug-in for DataTables
 * @version     2.2.3
 * @file        dataTables.responsive.js
 * @author      SpryMedia Ltd (www.sprymedia.co.uk)
 * @contact     www.sprymedia.co.uk/contact
 * @copyright   Copyright 2014-2018 SpryMedia Ltd.
 *
 * This source file is free software, available under the following license:
 *   MIT license - http://datatables.net/license/mit
 *
 * This source file is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the license files for details.
 *
 * For details please refer to: http://www.datatables.net
 */
(function( factory ){
	if ( typeof define === 'function' && define.amd ) {
		// AMD
		define( ['jquery', 'datatables.net'], function ( $ ) {
			return factory( $, window, document );
		} );
	}
	else if ( typeof exports === 'object' ) {
		// CommonJS
		module.exports = function (root, $) {
			if ( ! root ) {
				root = window;
			}

			if ( ! $ || ! $.fn.dataTable ) {
				$ = require('datatables.net')(root, $).$;
			}

			return factory( $, root, root.document );
		};
	}
	else {
		// Browser
		factory( jQuery, window, document );
	}
}(function( $, window, document, undefined ) {
'use strict';
var DataTable = $.fn.dataTable;


/**
 * Responsive is a plug-in for the DataTables library that makes use of
 * DataTables' ability to change the visibility of columns, changing the
 * visibility of columns so the displayed columns fit into the table container.
 * The end result is that complex tables will be dynamically adjusted to fit
 * into the viewport, be it on a desktop, tablet or mobile browser.
 *
 * Responsive for DataTables has two modes of operation, which can used
 * individually or combined:
 *
 * * Class name based control - columns assigned class names that match the
 *   breakpoint logic can be shown / hidden as required for each breakpoint.
 * * Automatic control - columns are automatically hidden when there is no
 *   room left to display them. Columns removed from the right.
 *
 * In additional to column visibility control, Responsive also has built into
 * options to use DataTables' child row display to show / hide the information
 * from the table that has been hidden. There are also two modes of operation
 * for this child row display:
 *
 * * Inline - when the control element that the user can use to show / hide
 *   child rows is displayed inside the first column of the table.
 * * Column - where a whole column is dedicated to be the show / hide control.
 *
 * Initialisation of Responsive is performed by:
 *
 * * Adding the class `responsive` or `dt-responsive` to the table. In this case
 *   Responsive will automatically be initialised with the default configuration
 *   options when the DataTable is created.
 * * Using the `responsive` option in the DataTables configuration options. This
 *   can also be used to specify the configuration options, or simply set to
 *   `true` to use the defaults.
 *
 *  @class
 *  @param {object} settings DataTables settings object for the host table
 *  @param {object} [opts] Configuration options
 *  @requires jQuery 1.7+
 *  @requires DataTables 1.10.3+
 *
 *  @example
 *      $('#example').DataTable( {
 *        responsive: true
 *      } );
 *    } );
 */
var Responsive = function ( settings, opts ) {
	// Sanity check that we are using DataTables 1.10 or newer
	if ( ! DataTable.versionCheck || ! DataTable.versionCheck( '1.10.10' ) ) {
		throw 'DataTables Responsive requires DataTables 1.10.10 or newer';
	}

	this.s = {
		dt: new DataTable.Api( settings ),
		columns: [],
		current: []
	};

	// Check if responsive has already been initialised on this table
	if ( this.s.dt.settings()[0].responsive ) {
		return;
	}

	// details is an object, but for simplicity the user can give it as a string
	// or a boolean
	if ( opts && typeof opts.details === 'string' ) {
		opts.details = { type: opts.details };
	}
	else if ( opts && opts.details === false ) {
		opts.details = { type: false };
	}
	else if ( opts && opts.details === true ) {
		opts.details = { type: 'inline' };
	}

	this.c = $.extend( true, {}, Responsive.defaults, DataTable.defaults.responsive, opts );
	settings.responsive = this;
	this._constructor();
};

$.extend( Responsive.prototype, {
	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Constructor
	 */

	/**
	 * Initialise the Responsive instance
	 *
	 * @private
	 */
	_constructor: function ()
	{
		var that = this;
		var dt = this.s.dt;
		var dtPrivateSettings = dt.settings()[0];
		var oldWindowWidth = $(window).width();

		dt.settings()[0]._responsive = this;

		// Use DataTables' throttle function to avoid processor thrashing on
		// resize
		$(window).on( 'resize.dtr orientationchange.dtr', DataTable.util.throttle( function () {
			// iOS has a bug whereby resize can fire when only scrolling
			// See: http://stackoverflow.com/questions/8898412
			var width = $(window).width();

			if ( width !== oldWindowWidth ) {
				that._resize();
				oldWindowWidth = width;
			}
		} ) );

		// DataTables doesn't currently trigger an event when a row is added, so
		// we need to hook into its private API to enforce the hidden rows when
		// new data is added
		dtPrivateSettings.oApi._fnCallbackReg( dtPrivateSettings, 'aoRowCreatedCallback', function (tr, data, idx) {
			if ( $.inArray( false, that.s.current ) !== -1 ) {
				$('>td, >th', tr).each( function ( i ) {
					var idx = dt.column.index( 'toData', i );

					if ( that.s.current[idx] === false ) {
						$(this).css('display', 'none');
					}
				} );
			}
		} );

		// Destroy event handler
		dt.on( 'destroy.dtr', function () {
			dt.off( '.dtr' );
			$( dt.table().body() ).off( '.dtr' );
			$(window).off( 'resize.dtr orientationchange.dtr' );

			// Restore the columns that we've hidden
			$.each( that.s.current, function ( i, val ) {
				if ( val === false ) {
					that._setColumnVis( i, true );
				}
			} );
		} );

		// Reorder the breakpoints array here in case they have been added out
		// of order
		this.c.breakpoints.sort( function (a, b) {
			return a.width < b.width ? 1 :
				a.width > b.width ? -1 : 0;
		} );

		this._classLogic();
		this._resizeAuto();

		// Details handler
		var details = this.c.details;

		if ( details.type !== false ) {
			that._detailsInit();

			// DataTables will trigger this event on every column it shows and
			// hides individually
			dt.on( 'column-visibility.dtr', function () {
				// Use a small debounce to allow multiple columns to be set together
				if ( that._timer ) {
					clearTimeout( that._timer );
				}

				that._timer = setTimeout( function () {
					that._timer = null;

					that._classLogic();
					that._resizeAuto();
					that._resize();

					that._redrawChildren();
				}, 100 );
			} );

			// Redraw the details box on each draw which will happen if the data
			// has changed. This is used until DataTables implements a native
			// `updated` event for rows
			dt.on( 'draw.dtr', function () {
				that._redrawChildren();
			} );

			$(dt.table().node()).addClass( 'dtr-'+details.type );
		}

		dt.on( 'column-reorder.dtr', function (e, settings, details) {
			that._classLogic();
			that._resizeAuto();
			that._resize();
		} );

		// Change in column sizes means we need to calc
		dt.on( 'column-sizing.dtr', function () {
			that._resizeAuto();
			that._resize();
		});

		// On Ajax reload we want to reopen any child rows which are displayed
		// by responsive
		dt.on( 'preXhr.dtr', function () {
			var rowIds = [];
			dt.rows().every( function () {
				if ( this.child.isShown() ) {
					rowIds.push( this.id(true) );
				}
			} );

			dt.one( 'draw.dtr', function () {
				that._resizeAuto();
				that._resize();

				dt.rows( rowIds ).every( function () {
					that._detailsDisplay( this, false );
				} );
			} );
		});

		dt.on( 'init.dtr', function (e, settings, details) {
			that._resizeAuto();
			that._resize();

			// If columns were hidden, then DataTables needs to adjust the
			// column sizing
			if ( $.inArray( false, that.s.current ) ) {
				dt.columns.adjust();
			}
		} );

		// First pass - draw the table for the current viewport size
		this._resize();
	},


	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Private methods
	 */

	/**
	 * Calculate the visibility for the columns in a table for a given
	 * breakpoint. The result is pre-determined based on the class logic if
	 * class names are used to control all columns, but the width of the table
	 * is also used if there are columns which are to be automatically shown
	 * and hidden.
	 *
	 * @param  {string} breakpoint Breakpoint name to use for the calculation
	 * @return {array} Array of boolean values initiating the visibility of each
	 *   column.
	 *  @private
	 */
	_columnsVisiblity: function ( breakpoint )
	{
		var dt = this.s.dt;
		var columns = this.s.columns;
		var i, ien;

		// Create an array that defines the column ordering based first on the
		// column's priority, and secondly the column index. This allows the
		// columns to be removed from the right if the priority matches
		var order = columns
			.map( function ( col, idx ) {
				return {
					columnIdx: idx,
					priority: col.priority
				};
			} )
			.sort( function ( a, b ) {
				if ( a.priority !== b.priority ) {
					return a.priority - b.priority;
				}
				return a.columnIdx - b.columnIdx;
			} );

		// Class logic - determine which columns are in this breakpoint based
		// on the classes. If no class control (i.e. `auto`) then `-` is used
		// to indicate this to the rest of the function
		var display = $.map( columns, function ( col, i ) {
			if ( dt.column(i).visible() === false ) {
				return 'not-visible';
			}
			return col.auto && col.minWidth === null ?
				false :
				col.auto === true ?
					'-' :
					$.inArray( breakpoint, col.includeIn ) !== -1;
		} );

		// Auto column control - first pass: how much width is taken by the
		// ones that must be included from the non-auto columns
		var requiredWidth = 0;
		for ( i=0, ien=display.length ; i<ien ; i++ ) {
			if ( display[i] === true ) {
				requiredWidth += columns[i].minWidth;
			}
		}

		// Second pass, use up any remaining width for other columns. For
		// scrolling tables we need to subtract the width of the scrollbar. It
		// may not be requires which makes this sub-optimal, but it would
		// require another full redraw to make complete use of those extra few
		// pixels
		var scrolling = dt.settings()[0].oScroll;
		var bar = scrolling.sY || scrolling.sX ? scrolling.iBarWidth : 0;
		var widthAvailable = dt.table().container().offsetWidth - bar;
		var usedWidth = widthAvailable - requiredWidth;

		// Control column needs to always be included. This makes it sub-
		// optimal in terms of using the available with, but to stop layout
		// thrashing or overflow. Also we need to account for the control column
		// width first so we know how much width is available for the other
		// columns, since the control column might not be the first one shown
		for ( i=0, ien=display.length ; i<ien ; i++ ) {
			if ( columns[i].control ) {
				usedWidth -= columns[i].minWidth;
			}
		}

		// Allow columns to be shown (counting by priority and then right to
		// left) until we run out of room
		var empty = false;
		for ( i=0, ien=order.length ; i<ien ; i++ ) {
			var colIdx = order[i].columnIdx;

			if ( display[colIdx] === '-' && ! columns[colIdx].control && columns[colIdx].minWidth ) {
				// Once we've found a column that won't fit we don't let any
				// others display either, or columns might disappear in the
				// middle of the table
				if ( empty || usedWidth - columns[colIdx].minWidth < 0 ) {
					empty = true;
					display[colIdx] = false;
				}
				else {
					display[colIdx] = true;
				}

				usedWidth -= columns[colIdx].minWidth;
			}
		}

		// Determine if the 'control' column should be shown (if there is one).
		// This is the case when there is a hidden column (that is not the
		// control column). The two loops look inefficient here, but they are
		// trivial and will fly through. We need to know the outcome from the
		// first , before the action in the second can be taken
		var showControl = false;

		for ( i=0, ien=columns.length ; i<ien ; i++ ) {
			if ( ! columns[i].control && ! columns[i].never && display[i] === false ) {
				showControl = true;
				break;
			}
		}

		for ( i=0, ien=columns.length ; i<ien ; i++ ) {
			if ( columns[i].control ) {
				display[i] = showControl;
			}

			// Replace not visible string with false from the control column detection above
			if ( display[i] === 'not-visible' ) {
				display[i] = false;
			}
		}

		// Finally we need to make sure that there is at least one column that
		// is visible
		if ( $.inArray( true, display ) === -1 ) {
			display[0] = true;
		}

		return display;
	},


	/**
	 * Create the internal `columns` array with information about the columns
	 * for the table. This includes determining which breakpoints the column
	 * will appear in, based upon class names in the column, which makes up the
	 * vast majority of this method.
	 *
	 * @private
	 */
	_classLogic: function ()
	{
		var that = this;
		var calc = {};
		var breakpoints = this.c.breakpoints;
		var dt = this.s.dt;
		var columns = dt.columns().eq(0).map( function (i) {
			var column = this.column(i);
			var className = column.header().className;
			var priority = dt.settings()[0].aoColumns[i].responsivePriority;

			if ( priority === undefined ) {
				var dataPriority = $(column.header()).data('priority');

				priority = dataPriority !== undefined ?
					dataPriority * 1 :
					10000;
			}

			return {
				className: className,
				includeIn: [],
				auto:      false,
				control:   false,
				never:     className.match(/\bnever\b/) ? true : false,
				priority:  priority
			};
		} );

		// Simply add a breakpoint to `includeIn` array, ensuring that there are
		// no duplicates
		var add = function ( colIdx, name ) {
			var includeIn = columns[ colIdx ].includeIn;

			if ( $.inArray( name, includeIn ) === -1 ) {
				includeIn.push( name );
			}
		};

		var column = function ( colIdx, name, operator, matched ) {
			var size, i, ien;

			if ( ! operator ) {
				columns[ colIdx ].includeIn.push( name );
			}
			else if ( operator === 'max-' ) {
				// Add this breakpoint and all smaller
				size = that._find( name ).width;

				for ( i=0, ien=breakpoints.length ; i<ien ; i++ ) {
					if ( breakpoints[i].width <= size ) {
						add( colIdx, breakpoints[i].name );
					}
				}
			}
			else if ( operator === 'min-' ) {
				// Add this breakpoint and all larger
				size = that._find( name ).width;

				for ( i=0, ien=breakpoints.length ; i<ien ; i++ ) {
					if ( breakpoints[i].width >= size ) {
						add( colIdx, breakpoints[i].name );
					}
				}
			}
			else if ( operator === 'not-' ) {
				// Add all but this breakpoint
				for ( i=0, ien=breakpoints.length ; i<ien ; i++ ) {
					if ( breakpoints[i].name.indexOf( matched ) === -1 ) {
						add( colIdx, breakpoints[i].name );
					}
				}
			}
		};

		// Loop over each column and determine if it has a responsive control
		// class
		columns.each( function ( col, i ) {
			var classNames = col.className.split(' ');
			var hasClass = false;

			// Split the class name up so multiple rules can be applied if needed
			for ( var k=0, ken=classNames.length ; k<ken ; k++ ) {
				var className = $.trim( classNames[k] );

				if ( className === 'all' ) {
					// Include in all
					hasClass = true;
					col.includeIn = $.map( breakpoints, function (a) {
						return a.name;
					} );
					return;
				}
				else if ( className === 'none' || col.never ) {
					// Include in none (default) and no auto
					hasClass = true;
					return;
				}
				else if ( className === 'control' ) {
					// Special column that is only visible, when one of the other
					// columns is hidden. This is used for the details control
					hasClass = true;
					col.control = true;
					return;
				}

				$.each( breakpoints, function ( j, breakpoint ) {
					// Does this column have a class that matches this breakpoint?
					var brokenPoint = breakpoint.name.split('-');
					var re = new RegExp( '(min\\-|max\\-|not\\-)?('+brokenPoint[0]+')(\\-[_a-zA-Z0-9])?' );
					var match = className.match( re );

					if ( match ) {
						hasClass = true;

						if ( match[2] === brokenPoint[0] && match[3] === '-'+brokenPoint[1] ) {
							// Class name matches breakpoint name fully
							column( i, breakpoint.name, match[1], match[2]+match[3] );
						}
						else if ( match[2] === brokenPoint[0] && ! match[3] ) {
							// Class name matched primary breakpoint name with no qualifier
							column( i, breakpoint.name, match[1], match[2] );
						}
					}
				} );
			}

			// If there was no control class, then automatic sizing is used
			if ( ! hasClass ) {
				col.auto = true;
			}
		} );

		this.s.columns = columns;
	},


	/**
	 * Show the details for the child row
	 *
	 * @param  {DataTables.Api} row    API instance for the row
	 * @param  {boolean}        update Update flag
	 * @private
	 */
	_detailsDisplay: function ( row, update )
	{
		var that = this;
		var dt = this.s.dt;
		var details = this.c.details;

		if ( details && details.type !== false ) {
			var res = details.display( row, update, function () {
				return details.renderer(
					dt, row[0], that._detailsObj(row[0])
				);
			} );

			if ( res === true || res === false ) {
				$(dt.table().node()).triggerHandler( 'responsive-display.dt', [dt, row, res, update] );
			}
		}
	},


	/**
	 * Initialisation for the details handler
	 *
	 * @private
	 */
	_detailsInit: function ()
	{
		var that    = this;
		var dt      = this.s.dt;
		var details = this.c.details;

		// The inline type always uses the first child as the target
		if ( details.type === 'inline' ) {
			details.target = 'td:first-child, th:first-child';
		}

		// Keyboard accessibility
		dt.on( 'draw.dtr', function () {
			that._tabIndexes();
		} );
		that._tabIndexes(); // Initial draw has already happened

		$( dt.table().body() ).on( 'keyup.dtr', 'td, th', function (e) {
			if ( e.keyCode === 13 && $(this).data('dtr-keyboard') ) {
				$(this).click();
			}
		} );

		// type.target can be a string jQuery selector or a column index
		var target   = details.target;
		var selector = typeof target === 'string' ? target : 'td, th';

		// Click handler to show / hide the details rows when they are available
		$( dt.table().body() )
			.on( 'click.dtr mousedown.dtr mouseup.dtr', selector, function (e) {
				// If the table is not collapsed (i.e. there is no hidden columns)
				// then take no action
				if ( ! $(dt.table().node()).hasClass('collapsed' ) ) {
					return;
				}

				// Check that the row is actually a DataTable's controlled node
				if ( $.inArray( $(this).closest('tr').get(0), dt.rows().nodes().toArray() ) === -1 ) {
					return;
				}

				// For column index, we determine if we should act or not in the
				// handler - otherwise it is already okay
				if ( typeof target === 'number' ) {
					var targetIdx = target < 0 ?
						dt.columns().eq(0).length + target :
						target;

					if ( dt.cell( this ).index().column !== targetIdx ) {
						return;
					}
				}

				// $().closest() includes itself in its check
				var row = dt.row( $(this).closest('tr') );

				// Check event type to do an action
				if ( e.type === 'click' ) {
					// The renderer is given as a function so the caller can execute it
					// only when they need (i.e. if hiding there is no point is running
					// the renderer)
					that._detailsDisplay( row, false );
				}
				else if ( e.type === 'mousedown' ) {
					// For mouse users, prevent the focus ring from showing
					$(this).css('outline', 'none');
				}
				else if ( e.type === 'mouseup' ) {
					// And then re-allow at the end of the click
					$(this).blur().css('outline', '');
				}
			} );
	},


	/**
	 * Get the details to pass to a renderer for a row
	 * @param  {int} rowIdx Row index
	 * @private
	 */
	_detailsObj: function ( rowIdx )
	{
		var that = this;
		var dt = this.s.dt;

		return $.map( this.s.columns, function( col, i ) {
			// Never and control columns should not be passed to the renderer
			if ( col.never || col.control ) {
				return;
			}

			return {
				title:       dt.settings()[0].aoColumns[ i ].sTitle,
				data:        dt.cell( rowIdx, i ).render( that.c.orthogonal ),
				hidden:      dt.column( i ).visible() && !that.s.current[ i ],
				columnIndex: i,
				rowIndex:    rowIdx
			};
		} );
	},


	/**
	 * Find a breakpoint object from a name
	 *
	 * @param  {string} name Breakpoint name to find
	 * @return {object}      Breakpoint description object
	 * @private
	 */
	_find: function ( name )
	{
		var breakpoints = this.c.breakpoints;

		for ( var i=0, ien=breakpoints.length ; i<ien ; i++ ) {
			if ( breakpoints[i].name === name ) {
				return breakpoints[i];
			}
		}
	},


	/**
	 * Re-create the contents of the child rows as the display has changed in
	 * some way.
	 *
	 * @private
	 */
	_redrawChildren: function ()
	{
		var that = this;
		var dt = this.s.dt;

		dt.rows( {page: 'current'} ).iterator( 'row', function ( settings, idx ) {
			var row = dt.row( idx );

			that._detailsDisplay( dt.row( idx ), true );
		} );
	},


	/**
	 * Alter the table display for a resized viewport. This involves first
	 * determining what breakpoint the window currently is in, getting the
	 * column visibilities to apply and then setting them.
	 *
	 * @private
	 */
	_resize: function ()
	{
		var that = this;
		var dt = this.s.dt;
		var width = $(window).width();
		var breakpoints = this.c.breakpoints;
		var breakpoint = breakpoints[0].name;
		var columns = this.s.columns;
		var i, ien;
		var oldVis = this.s.current.slice();

		// Determine what breakpoint we are currently at
		for ( i=breakpoints.length-1 ; i>=0 ; i-- ) {
			if ( width <= breakpoints[i].width ) {
				breakpoint = breakpoints[i].name;
				break;
			}
		}
		
		// Show the columns for that break point
		var columnsVis = this._columnsVisiblity( breakpoint );
		this.s.current = columnsVis;

		// Set the class before the column visibility is changed so event
		// listeners know what the state is. Need to determine if there are
		// any columns that are not visible but can be shown
		var collapsedClass = false;
		for ( i=0, ien=columns.length ; i<ien ; i++ ) {
			if ( columnsVis[i] === false && ! columns[i].never && ! columns[i].control && ! dt.column(i).visible() === false ) {
				collapsedClass = true;
				break;
			}
		}

		$( dt.table().node() ).toggleClass( 'collapsed', collapsedClass );

		var changed = false;
		var visible = 0;

		dt.columns().eq(0).each( function ( colIdx, i ) {
			if ( columnsVis[i] === true ) {
				visible++;
			}

			if ( columnsVis[i] !== oldVis[i] ) {
				changed = true;
				that._setColumnVis( colIdx, columnsVis[i] );
			}
		} );

		if ( changed ) {
			this._redrawChildren();

			// Inform listeners of the change
			$(dt.table().node()).trigger( 'responsive-resize.dt', [dt, this.s.current] );

			// If no records, update the "No records" display element
			if ( dt.page.info().recordsDisplay === 0 ) {
				$('td', dt.table().body()).eq(0).attr('colspan', visible);
			}
		}
	},


	/**
	 * Determine the width of each column in the table so the auto column hiding
	 * has that information to work with. This method is never going to be 100%
	 * perfect since column widths can change slightly per page, but without
	 * seriously compromising performance this is quite effective.
	 *
	 * @private
	 */
	_resizeAuto: function ()
	{
		var dt = this.s.dt;
		var columns = this.s.columns;

		// Are we allowed to do auto sizing?
		if ( ! this.c.auto ) {
			return;
		}

		// Are there any columns that actually need auto-sizing, or do they all
		// have classes defined
		if ( $.inArray( true, $.map( columns, function (c) { return c.auto; } ) ) === -1 ) {
			return;
		}

		// Need to restore all children. They will be reinstated by a re-render
		if ( ! $.isEmptyObject( _childNodeStore ) ) {
			$.each( _childNodeStore, function ( key ) {
				var idx = key.split('-');

				_childNodesRestore( dt, idx[0]*1, idx[1]*1 );
			} );
		}

		// Clone the table with the current data in it
		var tableWidth   = dt.table().node().offsetWidth;
		var columnWidths = dt.columns;
		var clonedTable  = dt.table().node().cloneNode( false );
		var clonedHeader = $( dt.table().header().cloneNode( false ) ).appendTo( clonedTable );
		var clonedBody   = $( dt.table().body() ).clone( false, false ).empty().appendTo( clonedTable ); // use jQuery because of IE8

		// Header
		var headerCells = dt.columns()
			.header()
			.filter( function (idx) {
				return dt.column(idx).visible();
			} )
			.to$()
			.clone( false )
			.css( 'display', 'table-cell' )
			.css( 'min-width', 0 );

		// Body rows - we don't need to take account of DataTables' column
		// visibility since we implement our own here (hence the `display` set)
		$(clonedBody)
			.append( $(dt.rows( { page: 'current' } ).nodes()).clone( false ) )
			.find( 'th, td' ).css( 'display', '' );

		// Footer
		var footer = dt.table().footer();
		if ( footer ) {
			var clonedFooter = $( footer.cloneNode( false ) ).appendTo( clonedTable );
			var footerCells = dt.columns()
				.footer()
				.filter( function (idx) {
					return dt.column(idx).visible();
				} )
				.to$()
				.clone( false )
				.css( 'display', 'table-cell' );

			$('<tr/>')
				.append( footerCells )
				.appendTo( clonedFooter );
		}

		$('<tr/>')
			.append( headerCells )
			.appendTo( clonedHeader );

		// In the inline case extra padding is applied to the first column to
		// give space for the show / hide icon. We need to use this in the
		// calculation
		if ( this.c.details.type === 'inline' ) {
			$(clonedTable).addClass( 'dtr-inline collapsed' );
		}
		
		// It is unsafe to insert elements with the same name into the DOM
		// multiple times. For example, cloning and inserting a checked radio
		// clears the chcecked state of the original radio.
		$( clonedTable ).find( '[name]' ).removeAttr( 'name' );

		// A position absolute table would take the table out of the flow of
		// our container element, bypassing the height and width (Scroller)
		$( clonedTable ).css( 'position', 'relative' )
		
		var inserted = $('<div/>')
			.css( {
				width: 1,
				height: 1,
				overflow: 'hidden',
				clear: 'both'
			} )
			.append( clonedTable );

		inserted.insertBefore( dt.table().node() );

		// The cloned header now contains the smallest that each column can be
		headerCells.each( function (i) {
			var idx = dt.column.index( 'fromVisible', i );
			columns[ idx ].minWidth =  this.offsetWidth || 0;
		} );

		inserted.remove();
	},

	/**
	 * Set a column's visibility.
	 *
	 * We don't use DataTables' column visibility controls in order to ensure
	 * that column visibility can Responsive can no-exist. Since only IE8+ is
	 * supported (and all evergreen browsers of course) the control of the
	 * display attribute works well.
	 *
	 * @param {integer} col      Column index
	 * @param {boolean} showHide Show or hide (true or false)
	 * @private
	 */
	_setColumnVis: function ( col, showHide )
	{
		var dt = this.s.dt;
		var display = showHide ? '' : 'none'; // empty string will remove the attr

		$( dt.column( col ).header() ).css( 'display', display );
		$( dt.column( col ).footer() ).css( 'display', display );
		dt.column( col ).nodes().to$().css( 'display', display );

		// If the are child nodes stored, we might need to reinsert them
		if ( ! $.isEmptyObject( _childNodeStore ) ) {
			dt.cells( null, col ).indexes().each( function (idx) {
				_childNodesRestore( dt, idx.row, idx.column );
			} );
		}
	},


	/**
	 * Update the cell tab indexes for keyboard accessibility. This is called on
	 * every table draw - that is potentially inefficient, but also the least
	 * complex option given that column visibility can change on the fly. Its a
	 * shame user-focus was removed from CSS 3 UI, as it would have solved this
	 * issue with a single CSS statement.
	 *
	 * @private
	 */
	_tabIndexes: function ()
	{
		var dt = this.s.dt;
		var cells = dt.cells( { page: 'current' } ).nodes().to$();
		var ctx = dt.settings()[0];
		var target = this.c.details.target;

		cells.filter( '[data-dtr-keyboard]' ).removeData( '[data-dtr-keyboard]' );

		if ( typeof target === 'number' ) {
			dt.cells( null, target, { page: 'current' } ).nodes().to$()
				.attr( 'tabIndex', ctx.iTabIndex )
				.data( 'dtr-keyboard', 1 );
		}
		else {
			// This is a bit of a hack - we need to limit the selected nodes to just
			// those of this table
			if ( target === 'td:first-child, th:first-child' ) {
				target = '>td:first-child, >th:first-child';
			}

			$( target, dt.rows( { page: 'current' } ).nodes() )
				.attr( 'tabIndex', ctx.iTabIndex )
				.data( 'dtr-keyboard', 1 );
		}
	}
} );


/**
 * List of default breakpoints. Each item in the array is an object with two
 * properties:
 *
 * * `name` - the breakpoint name.
 * * `width` - the breakpoint width
 *
 * @name Responsive.breakpoints
 * @static
 */
Responsive.breakpoints = [
	{ name: 'desktop',  width: Infinity },
	{ name: 'tablet-l', width: 1024 },
	{ name: 'tablet-p', width: 768 },
	{ name: 'mobile-l', width: 480 },
	{ name: 'mobile-p', width: 320 }
];


/**
 * Display methods - functions which define how the hidden data should be shown
 * in the table.
 *
 * @namespace
 * @name Responsive.defaults
 * @static
 */
Responsive.display = {
	childRow: function ( row, update, render ) {
		if ( update ) {
			if ( $(row.node()).hasClass('parent') ) {
				row.child( render(), 'child' ).show();

				return true;
			}
		}
		else {
			if ( ! row.child.isShown()  ) {
				row.child( render(), 'child' ).show();
				$( row.node() ).addClass( 'parent' );

				return true;
			}
			else {
				row.child( false );
				$( row.node() ).removeClass( 'parent' );

				return false;
			}
		}
	},

	childRowImmediate: function ( row, update, render ) {
		if ( (! update && row.child.isShown()) || ! row.responsive.hasHidden() ) {
			// User interaction and the row is show, or nothing to show
			row.child( false );
			$( row.node() ).removeClass( 'parent' );

			return false;
		}
		else {
			// Display
			row.child( render(), 'child' ).show();
			$( row.node() ).addClass( 'parent' );

			return true;
		}
	},

	// This is a wrapper so the modal options for Bootstrap and jQuery UI can
	// have options passed into them. This specific one doesn't need to be a
	// function but it is for consistency in the `modal` name
	modal: function ( options ) {
		return function ( row, update, render ) {
			if ( ! update ) {
				// Show a modal
				var close = function () {
					modal.remove(); // will tidy events for us
					$(document).off( 'keypress.dtr' );
				};

				var modal = $('<div class="dtr-modal"/>')
					.append( $('<div class="dtr-modal-display"/>')
						.append( $('<div class="dtr-modal-content"/>')
							.append( render() )
						)
						.append( $('<div class="dtr-modal-close">&times;</div>' )
							.click( function () {
								close();
							} )
						)
					)
					.append( $('<div class="dtr-modal-background"/>')
						.click( function () {
							close();
						} )
					)
					.appendTo( 'body' );

				$(document).on( 'keyup.dtr', function (e) {
					if ( e.keyCode === 27 ) {
						e.stopPropagation();

						close();
					}
				} );
			}
			else {
				$('div.dtr-modal-content')
					.empty()
					.append( render() );
			}

			if ( options && options.header ) {
				$('div.dtr-modal-content').prepend(
					'<h2>'+options.header( row )+'</h2>'
				);
			}
		};
	}
};


var _childNodeStore = {};

function _childNodes( dt, row, col ) {
	var name = row+'-'+col;

	if ( _childNodeStore[ name ] ) {
		return _childNodeStore[ name ];
	}

	// https://jsperf.com/childnodes-array-slice-vs-loop
	var nodes = [];
	var children = dt.cell( row, col ).node().childNodes;
	for ( var i=0, ien=children.length ; i<ien ; i++ ) {
		nodes.push( children[i] );
	}

	_childNodeStore[ name ] = nodes;

	return nodes;
}

function _childNodesRestore( dt, row, col ) {
	var name = row+'-'+col;

	if ( ! _childNodeStore[ name ] ) {
		return;
	}

	var node = dt.cell( row, col ).node();
	var store = _childNodeStore[ name ];
	var parent = store[0].parentNode;
	var parentChildren = parent.childNodes;
	var a = [];

	for ( var i=0, ien=parentChildren.length ; i<ien ; i++ ) {
		a.push( parentChildren[i] );
	}

	for ( var j=0, jen=a.length ; j<jen ; j++ ) {
		node.appendChild( a[j] );
	}

	_childNodeStore[ name ] = undefined;
}


/**
 * Display methods - functions which define how the hidden data should be shown
 * in the table.
 *
 * @namespace
 * @name Responsive.defaults
 * @static
 */
Responsive.renderer = {
	listHiddenNodes: function () {
		return function ( api, rowIdx, columns ) {
			var ul = $('<ul data-dtr-index="'+rowIdx+'" class="dtr-details"/>');
			var found = false;

			var data = $.each( columns, function ( i, col ) {
				if ( col.hidden ) {
					$(
						'<li data-dtr-index="'+col.columnIndex+'" data-dt-row="'+col.rowIndex+'" data-dt-column="'+col.columnIndex+'">'+
							'<span class="dtr-title">'+
								col.title+
							'</span> '+
						'</li>'
					)
						.append( $('<span class="dtr-data"/>').append( _childNodes( api, col.rowIndex, col.columnIndex ) ) )// api.cell( col.rowIndex, col.columnIndex ).node().childNodes ) )
						.appendTo( ul );

					found = true;
				}
			} );

			return found ?
				ul :
				false;
		};
	},

	listHidden: function () {
		return function ( api, rowIdx, columns ) {
			var data = $.map( columns, function ( col ) {
				return col.hidden ?
					'<li data-dtr-index="'+col.columnIndex+'" data-dt-row="'+col.rowIndex+'" data-dt-column="'+col.columnIndex+'">'+
						'<span class="dtr-title">'+
							col.title+
						'</span> '+
						'<span class="dtr-data">'+
							col.data+
						'</span>'+
					'</li>' :
					'';
			} ).join('');

			return data ?
				$('<ul data-dtr-index="'+rowIdx+'" class="dtr-details"/>').append( data ) :
				false;
		}
	},

	tableAll: function ( options ) {
		options = $.extend( {
			tableClass: ''
		}, options );

		return function ( api, rowIdx, columns ) {
			var data = $.map( columns, function ( col ) {
				return '<tr data-dt-row="'+col.rowIndex+'" data-dt-column="'+col.columnIndex+'">'+
						'<td>'+col.title+':'+'</td> '+
						'<td>'+col.data+'</td>'+
					'</tr>';
			} ).join('');

			return $('<table class="'+options.tableClass+' dtr-details" width="100%"/>').append( data );
		}
	}
};

/**
 * Responsive default settings for initialisation
 *
 * @namespace
 * @name Responsive.defaults
 * @static
 */
Responsive.defaults = {
	/**
	 * List of breakpoints for the instance. Note that this means that each
	 * instance can have its own breakpoints. Additionally, the breakpoints
	 * cannot be changed once an instance has been creased.
	 *
	 * @type {Array}
	 * @default Takes the value of `Responsive.breakpoints`
	 */
	breakpoints: Responsive.breakpoints,

	/**
	 * Enable / disable auto hiding calculations. It can help to increase
	 * performance slightly if you disable this option, but all columns would
	 * need to have breakpoint classes assigned to them
	 *
	 * @type {Boolean}
	 * @default  `true`
	 */
	auto: true,

	/**
	 * Details control. If given as a string value, the `type` property of the
	 * default object is set to that value, and the defaults used for the rest
	 * of the object - this is for ease of implementation.
	 *
	 * The object consists of the following properties:
	 *
	 * * `display` - A function that is used to show and hide the hidden details
	 * * `renderer` - function that is called for display of the child row data.
	 *   The default function will show the data from the hidden columns
	 * * `target` - Used as the selector for what objects to attach the child
	 *   open / close to
	 * * `type` - `false` to disable the details display, `inline` or `column`
	 *   for the two control types
	 *
	 * @type {Object|string}
	 */
	details: {
		display: Responsive.display.childRow,

		renderer: Responsive.renderer.listHidden(),

		target: 0,

		type: 'inline'
	},

	/**
	 * Orthogonal data request option. This is used to define the data type
	 * requested when Responsive gets the data to show in the child row.
	 *
	 * @type {String}
	 */
	orthogonal: 'display'
};


/*
 * API
 */
var Api = $.fn.dataTable.Api;

// Doesn't do anything - work around for a bug in DT... Not documented
Api.register( 'responsive()', function () {
	return this;
} );

Api.register( 'responsive.index()', function ( li ) {
	li = $(li);

	return {
		column: li.data('dtr-index'),
		row:    li.parent().data('dtr-index')
	};
} );

Api.register( 'responsive.rebuild()', function () {
	return this.iterator( 'table', function ( ctx ) {
		if ( ctx._responsive ) {
			ctx._responsive._classLogic();
		}
	} );
} );

Api.register( 'responsive.recalc()', function () {
	return this.iterator( 'table', function ( ctx ) {
		if ( ctx._responsive ) {
			ctx._responsive._resizeAuto();
			ctx._responsive._resize();
		}
	} );
} );

Api.register( 'responsive.hasHidden()', function () {
	var ctx = this.context[0];

	return ctx._responsive ?
		$.inArray( false, ctx._responsive.s.current ) !== -1 :
		false;
} );

Api.registerPlural( 'columns().responsiveHidden()', 'column().responsiveHidden()', function () {
	return this.iterator( 'column', function ( settings, column ) {
		return settings._responsive ?
			settings._responsive.s.current[ column ] :
			false;
	}, 1 );
} );


/**
 * Version information
 *
 * @name Responsive.version
 * @static
 */
Responsive.version = '2.2.3';


$.fn.dataTable.Responsive = Responsive;
$.fn.DataTable.Responsive = Responsive;

// Attach a listener to the document which listens for DataTables initialisation
// events so we can automatically initialise
$(document).on( 'preInit.dt.dtr', function (e, settings, json) {
	if ( e.namespace !== 'dt' ) {
		return;
	}

	if ( $(settings.nTable).hasClass( 'responsive' ) ||
		 $(settings.nTable).hasClass( 'dt-responsive' ) ||
		 settings.oInit.responsive ||
		 DataTable.defaults.responsive
	) {
		var init = settings.oInit.responsive;

		if ( init !== false ) {
			new Responsive( settings, $.isPlainObject( init ) ? init : {}  );
		}
	}
} );


return Responsive;
}));


/*! SearchPanes 1.0.1
 * 2019-2020 SpryMedia Ltd - datatables.net/license
 */
(function () {
    'use strict';

    var DataTable = $.fn.dataTable;
    var SearchPane = /** @class */ (function () {
        /**
         * Creates the panes, sets up the search function
         * @param paneSettings The settings for the searchPanes
         * @param opts The options for the default features
         * @param idx the index of the column for this pane
         * @returns {object} the pane that has been created, including the table and the index of the pane
         */
        function SearchPane(paneSettings, opts, idx, layout, panesContainer, panes) {
            var _this = this;
            if (panes === void 0) { panes = null; }
            // Check that the required version of DataTables is included
            if (!DataTable || !DataTable.versionCheck || !DataTable.versionCheck('1.10.0')) {
                throw new Error('SearchPane requires DataTables 1.10 or newer');
            }
            // Check that Select is included
            if (!DataTable.select) {
                throw new Error('SearchPane requires Select');
            }
            var table = new DataTable.Api(paneSettings);
            this.classes = $.extend(true, {}, SearchPane.classes);
            // Get options from user
            this.c = $.extend(true, {}, SearchPane.defaults, opts);
            this.customPaneSettings = panes;
            this.s = {
                cascadeRegen: false,
                clearing: false,
                colOpts: [],
                deselect: false,
                displayed: false,
                dt: table,
                dtPane: undefined,
                filteringActive: false,
                index: idx,
                indexes: [],
                lastSelect: false,
                redraw: false,
                rowData: {
                    arrayFilter: [],
                    arrayOriginal: [],
                    arrayTotals: [],
                    bins: {},
                    binsOriginal: {},
                    binsTotal: {},
                    filterMap: new Map()
                },
                searchFunction: undefined,
                selectPresent: false,
                updating: false
            };
            var rowLength = table.columns().eq(0).toArray().length;
            this.colExists = this.s.index < rowLength;
            // Add extra elements to DOM object including clear and hide buttons
            this.c.layout = layout;
            var layVal = parseInt(layout.split('-')[1], 10);
            this.dom = {
                buttonGroup: $('<div/>').addClass(this.classes.buttonGroup),
                clear: $('<button type="button">&#215;</button>')
                    .addClass(this.classes.dull)
                    .addClass(this.classes.paneButton)
                    .addClass(this.classes.clearButton),
                container: $('<div/>').addClass(this.classes.container).addClass(this.classes.layout +
                    (layVal < 7 ? layout : layout.split('-')[0] + '-6')),
                countButton: $('<button type="button"></button>')
                    .addClass(this.classes.paneButton)
                    .addClass(this.classes.countButton),
                dtP: $('<table><thead><tr><th>' +
                    (this.colExists
                        ? $(table.column(this.colExists ? this.s.index : 0).header()).text()
                        : this.customPaneSettings.header || 'Custom Pane') + '</th><th/></tr></thead></table>'),
                lower: $('<div/>').addClass(this.classes.subRow2).addClass(this.classes.narrowButton),
                nameButton: $('<button type="button"></button>').addClass(this.classes.paneButton).addClass(this.classes.nameButton),
                searchBox: $('<input/>').addClass(this.classes.paneInputButton).addClass(this.classes.search),
                searchButton: $('<button type = "button" class="' + this.classes.searchIcon + '"></button>')
                    .addClass(this.classes.paneButton),
                searchCont: $('<div/>').addClass(this.classes.searchCont),
                searchLabelCont: $('<div/>').addClass(this.classes.searchLabelCont),
                topRow: $('<div/>').addClass(this.classes.topRow),
                upper: $('<div/>').addClass(this.classes.subRow1).addClass(this.classes.narrowSearch)
            };
            this.s.displayed = false;
            table = this.s.dt;
            this.selections = [];
            this.s.colOpts = this.colExists ? this._getOptions() : this._getBonusOptions();
            var colOpts = this.s.colOpts;
            var clear = $('<button type="button">X</button>').addClass(this.classes.paneButton);
            $(clear).text(table.i18n('searchPanes.clearPane', 'X'));
            this.dom.container.addClass(colOpts.className);
            this.dom.container.addClass((this.customPaneSettings !== null && this.customPaneSettings.className !== undefined)
                ? this.customPaneSettings.className
                : '');
            $(panesContainer).append(this.dom.container);
            var tableNode = table.table(0).node();
            // Custom search function for table
            this.s.searchFunction = function (settings, searchData, dataIndex, origData) {
                // If no data has been selected then show all
                if (_this.selections.length === 0) {
                    return true;
                }
                if (settings.nTable !== tableNode) {
                    return true;
                }
                var filter = '';
                if (_this.colExists) {
                    // Get the current filtered data
                    filter = searchData[_this.s.index];
                    if (colOpts.orthogonal.filter !== 'filter') {
                        // get the filter value from the map
                        filter = _this.s.rowData.filterMap.get(dataIndex);
                        if (filter instanceof $.fn.dataTable.Api) {
                            filter = filter.toArray();
                        }
                    }
                }
                return _this._search(filter, dataIndex);
            };
            $.fn.dataTable.ext.search.push(this.s.searchFunction);
            // If the clear button for this pane is clicked clear the selections
            if (this.c.clear) {
                $(clear).on('click', function () {
                    var searches = _this.dom.container.find(_this.classes.search);
                    searches.each(function () {
                        $(this).val('');
                        $(this).trigger('input');
                    });
                    _this.clearPane();
                });
            }
            // Sometimes the top row of the panes containing the search box and ordering buttons appears
            //  weird if the width of the panes is lower than expected, this fixes the design.
            // Equally this may occur when the table is resized.
            table.on('draw.dtsp', function () {
                _this._adjustTopRow();
            });
            $(window).on('resize.dtsp', DataTable.util.throttle(function () {
                _this._adjustTopRow();
            }));
            // When column-reorder is present and the columns are moved, it is necessary to
            //  reassign all of the panes indexes to the new index of the column.
            table.on('column-reorder.dtsp', function (e, settings, details) {
                _this.s.index = details.mapping[_this.s.index];
            });
            return this;
        }
        /**
         * In the case of a rebuild there is potential for new data to have been included or removed
         * so all of the rowData must be reset as a precaution.
         */
        SearchPane.prototype.clearData = function () {
            this.s.rowData = {
                arrayFilter: [],
                arrayOriginal: [],
                arrayTotals: [],
                bins: {},
                binsOriginal: {},
                binsTotal: {},
                filterMap: new Map()
            };
        };
        /**
         * Clear the selections in the pane
         */
        SearchPane.prototype.clearPane = function () {
            // Deselect all rows which are selected and update the table and filter count.
            this.s.dtPane.rows({ selected: true }).deselect();
            this.updateTable();
            return this;
        };
        /**
         * Strips all of the SearchPanes elements from the document and turns all of the listeners for the buttons off
         */
        SearchPane.prototype.destroy = function () {
            $(this.s.dtPane).off('.dtsp');
            $(this.s.dt).off('.dtsp');
            $(this.dom.nameButton).off('.dtsp');
            $(this.dom.countButton).off('.dtsp');
            $(this.dom.clear).off('.dtsp');
            $(this.dom.searchButton).off('.dtsp');
            $(this.dom.container).remove();
            var searchIdx = $.fn.dataTable.ext.search.indexOf(this.s.searchFunction);
            while (searchIdx !== -1) {
                $.fn.dataTable.ext.search.splice(searchIdx, 1);
                searchIdx = $.fn.dataTable.ext.search.indexOf(this.s.searchFunction);
            }
            // If the datatables have been defined for the panes then also destroy these
            if (this.s.dtPane !== undefined) {
                this.s.dtPane.destroy();
            }
        };
        /**
         * Updates the number of filters that have been applied in the title
         */
        SearchPane.prototype.getPaneCount = function () {
            return this.s.dtPane !== undefined ?
                this.s.dtPane.rows({ selected: true }).data().toArray().length :
                0;
        };
        /**
         * Rebuilds the panes from the start having deleted the old ones
         */
        SearchPane.prototype.rebuildPane = function () {
            this.clearData();
            // When rebuilding strip all of the HTML Elements out of the container and start from scratch
            if (this.s.dtPane !== undefined) {
                this.s.dtPane.clear().destroy();
            }
            this.dom.container.removeClass(this.classes.hidden);
            this.s.displayed = false;
            this._buildPane();
            return this;
        };
        /**
         * removes the pane from the page and sets the displayed property to false.
         */
        SearchPane.prototype.removePane = function () {
            this.s.displayed = false;
            $(this.dom.container).hide();
        };
        /**
         * Sets the cascadeRegen property of the pane. Accessible from above because as SearchPanes.ts deals with the rebuilds.
         * @param val the boolean value that the cascadeRegen property is to be set to
         */
        SearchPane.prototype.setCascadeRegen = function (val) {
            this.s.cascadeRegen = val;
        };
        /**
         * This function allows the clearing property to be assigned. This is used when implementing cascadePane.
         * In setting this to true for the clearing of the panes selection on the deselects it forces the pane to
         * repopulate from the entire dataset not just the displayed values.
         * @param val the boolean value which the clearing property is to be assigned
         */
        SearchPane.prototype.setClear = function (val) {
            this.s.clearing = val;
        };
        /**
         * Updates the values of all of the panes
         * @param draw whether this has been triggered by a draw event or not
         */
        SearchPane.prototype.updatePane = function (draw) {
            if (draw === void 0) { draw = false; }
            this.s.updating = true;
            this._updateCommon(draw);
            this.s.updating = false;
        };
        /**
         * Updates the panes if one of the options to do so has been set to true
         *   rather than the filtered message when using viewTotal.
         */
        SearchPane.prototype.updateTable = function () {
            var selectedRows = this.s.dtPane.rows({ selected: true }).data().toArray();
            this.selections = selectedRows;
            this._searchExtras();
            // If either of the options that effect how the panes are displayed are selected then update the Panes
            if (this.c.cascadePanes || this.c.viewTotal) {
                this.updatePane();
            }
        };
        /**
         * Takes in potentially undetected rows and adds them to the array if they are not yet featured
         * @param filter the filter value of the potential row
         * @param display the display value of the potential row
         * @param sort the sort value of the potential row
         * @param type the type value of the potential row
         * @param arrayFilter the array to be populated
         * @param bins the bins to be populated
         */
        SearchPane.prototype._addOption = function (filter, display, sort, type, arrayFilter, bins) {
            // If the filter is an array then take a note of this, and add the elements to the arrayFilter array
            if (Array.isArray(filter) || filter instanceof DataTable.Api) {
                // Convert to an array so that we can work with it
                if (filter instanceof DataTable.Api) {
                    filter = filter.toArray();
                    display = display.toArray();
                }
                if (filter.length === display.length) {
                    for (var i = 0; i < filter.length; i++) {
                        // If we haven't seen this row before add it
                        if (!bins[filter[i]]) {
                            bins[filter[i]] = 1;
                            arrayFilter.push({
                                display: display[i],
                                filter: filter[i],
                                sort: sort,
                                type: type
                            });
                        }
                        // Otherwise just increment the count
                        else {
                            bins[filter[i]]++;
                        }
                    }
                    return;
                }
                else {
                    throw new Error('display and filter not the same length');
                }
            }
            // If the values were affected by othogonal data and are not an array then check if it is already present
            else if (typeof this.s.colOpts.orthogonal === 'string') {
                if (!bins[filter]) {
                    bins[filter] = 1;
                    arrayFilter.push({
                        display: display,
                        filter: filter,
                        sort: sort,
                        type: type
                    });
                }
                else {
                    bins[filter]++;
                    return;
                }
            }
            // Otherwise we must just be adding an option
            else {
                arrayFilter.push({
                    display: display,
                    filter: filter,
                    sort: sort,
                    type: type
                });
            }
        };
        /**
         * Adds a row to the panes table
         * @param display the value to be displayed to the user
         * @param filter the value to be filtered on when searchpanes is implemented
         * @param shown the number of rows in the table that are currently visible matching this criteria
         * @param total the total number of rows in the table that match this criteria
         * @param sort the value to be sorted in the pane table
         * @param type the value of which the type is to be derived from
         */
        SearchPane.prototype._addRow = function (display, filter, shown, total, sort, type) {
            var index;
            for (var _i = 0, _a = this.s.indexes; _i < _a.length; _i++) {
                var entry = _a[_i];
                if (entry.filter === filter) {
                    index = entry.index;
                }
            }
            if (index === undefined) {
                index = this.s.indexes.length;
                this.s.indexes.push({ filter: filter, index: index });
            }
            return this.s.dtPane.row.add({
                display: display !== '' ? display : this.c.emptyMessage,
                filter: filter,
                index: index,
                shown: shown,
                sort: sort !== '' ? sort : this.c.emptyMessage,
                total: total,
                type: type
            });
        };
        /**
         * Adjusts the layout of the top row when the screen is resized
         */
        SearchPane.prototype._adjustTopRow = function () {
            var subContainers = this.dom.container.find('.' + this.classes.subRowsContainer);
            var subRow1 = this.dom.container.find('.dtsp-subRow1');
            var subRow2 = this.dom.container.find('.dtsp-subRow2');
            var topRow = this.dom.container.find('.' + this.classes.topRow);
            // If the width is 0 then it is safe to assume that the pane has not yet been displayed.
            //  Even if it has, if the width is 0 it won't make a difference if it has the narrow class or not
            if (($(subContainers[0]).width() < 252 || $(topRow[0]).width() < 252) && $(subContainers[0]).width() !== 0) {
                $(subContainers[0]).addClass(this.classes.narrow);
                $(subRow1[0]).addClass(this.classes.narrowSub).removeClass(this.classes.narrowSearch);
                $(subRow2[0]).addClass(this.classes.narrowSub).removeClass(this.classes.narrowButton);
            }
            else {
                $(subContainers[0]).removeClass(this.classes.narrow);
                $(subRow1[0]).removeClass(this.classes.narrowSub).addClass(this.classes.narrowSearch);
                $(subRow2[0]).removeClass(this.classes.narrowSub).addClass(this.classes.narrowButton);
            }
        };
        /**
         * Method to construct the actual pane.
         */
        SearchPane.prototype._buildPane = function () {
            var _this = this;
            // Aliases
            this.selections = [];
            var table = this.s.dt;
            var column = table.column(this.colExists ? this.s.index : 0);
            var colOpts = this.s.colOpts;
            var rowData = this.s.rowData;
            // Other Variables
            var countMessage = table.i18n('searchPanes.count', '{total}');
            var filteredMessage = table.i18n('searchPanes.countFiltered', '{shown} ({total})');
            var loadedFilter = table.state.loaded();
            // If it is not a custom pane in place
            if (this.colExists) {
                var idx = -1;
                if (loadedFilter && loadedFilter.searchPanes && loadedFilter.searchPanes.panes) {
                    for (var i = 0; i < loadedFilter.searchPanes.panes.length; i++) {
                        if (loadedFilter.searchPanes.panes[i].id === this.s.index) {
                            idx = i;
                            break;
                        }
                    }
                }
                // Perform checks that do not require populate pane to run
                if ((colOpts.show === false
                    || (colOpts.show !== undefined && colOpts.show !== true)) &&
                    idx === -1) {
                    this.dom.container.addClass(this.classes.hidden);
                    this.s.displayed = false;
                    return false;
                }
                else if (colOpts.show === true || idx !== -1) {
                    this.s.displayed = true;
                }
                // Only run populatePane if the data has not been collected yet
                if (rowData.arrayFilter.length === 0) {
                    this._populatePane();
                    if (loadedFilter && loadedFilter.searchPanes && loadedFilter.searchPanes.panes) {
                        // If the index is not found then no data has been added to the state for this pane,
                        //  which will only occur if it has previously failed to meet the criteria to be
                        //  displayed, therefore we can just hide it again here
                        if (idx !== -1) {
                            rowData.binsOriginal = loadedFilter.searchPanes.panes[idx].bins;
                            rowData.arrayOriginal = loadedFilter.searchPanes.panes[idx].arrayFilter;
                        }
                        else {
                            this.dom.container.addClass(this.classes.hidden);
                            this.s.displayed = false;
                            return;
                        }
                    }
                    else {
                        rowData.arrayOriginal = rowData.arrayFilter;
                        rowData.binsOriginal = rowData.bins;
                    }
                }
                var binLength = Object.keys(rowData.binsOriginal).length;
                var uniqueRatio = this._uniqueRatio(binLength, table.rows()[0].length);
                // Don't show the pane if there isn't enough variance in the data, or there is only 1 entry for that pane
                if (this.s.displayed === false && ((colOpts.show === undefined && colOpts.threshold === null ?
                    uniqueRatio > this.c.threshold :
                    uniqueRatio > colOpts.threshold)
                    || (colOpts.show !== true && binLength <= 1))) {
                    this.dom.container.addClass(this.classes.hidden);
                    this.s.displayed = false;
                    return;
                }
                // If the option viewTotal is true then find
                // the total count for the whole table to display alongside the displayed count
                if (this.c.viewTotal && rowData.arrayTotals.length === 0) {
                    this._detailsPane();
                }
                else {
                    rowData.binsTotal = rowData.bins;
                }
                this.dom.container.addClass(this.classes.show);
                this.s.displayed = true;
            }
            else {
                this.s.displayed = true;
            }
            // If the variance is accceptable then display the search pane
            this._displayPane();
            // Here, when the state is loaded if the data object on the original table is empty,
            //  then a state.clear() must have occurred, so delete all of the panes tables state objects too.
            this.dom.dtP.on('stateLoadParams.dt', function (e, settings, data) {
                if ($.isEmptyObject(table.state.loaded())) {
                    $.each(data, function (index, value) {
                        delete data[index];
                    });
                }
            });
            // Declare the datatable for the pane
            var errMode = $.fn.dataTable.ext.errMode;
            $.fn.dataTable.ext.errMode = 'none';
            var haveScroller = DataTable.Scroller;
            this.s.dtPane = $(this.dom.dtP).DataTable($.extend(true, {
                dom: 't',
                columnDefs: [
                    {
                        className: 'dtsp-nameColumn',
                        data: 'display',
                        render: function (data, type, row) {
                            if (type === 'sort') {
                                return row.sort;
                            }
                            else if (type === 'type') {
                                return row.type;
                            }
                            var message;
                            _this.s.filteringActive && _this.c.viewTotal
                                ? message = filteredMessage.replace(/{total}/, row.total)
                                : message = countMessage.replace(/{total}/, row.total);
                            message = message.replace(/{shown}/, row.shown);
                            while (message.indexOf('{total}') !== -1) {
                                message = message.replace(/{total}/, row.total);
                            }
                            while (message.indexOf('{shown}') !== -1) {
                                message = message.replace(/{shown}/, row.shown);
                            }
                            // We are displaying the count in the same columne as the name of the search option.
                            // This is so that there is not need to call columns.adjust(), which in turn speeds up the code
                            var displayMessage = '';
                            var pill = '<span class="' + _this.classes.pill + '">' + message + '</span>';
                            if (_this.c.hideCount || colOpts.hideCount) {
                                pill = '';
                            }
                            if (!_this.c.dataLength) {
                                displayMessage = '<span class="' + _this.classes.name + '">' + data + '</span>' + pill;
                            }
                            else if (data.length > _this.c.dataLength) {
                                displayMessage = '<span class="' + _this.classes.name + '">'
                                    + data.substr(0, _this.c.dataLength) + '...'
                                    + '</span>'
                                    + pill;
                            }
                            else {
                                displayMessage = '<span class="' + _this.classes.name + '">' + data + '</span>' + pill;
                            }
                            return displayMessage;
                        },
                        targets: 0,
                        // Accessing the private datatables property to set type based on the original table.
                        // This is null if not defined by the user, meaning that automatic type detection would take place
                        type: table.settings()[0].aoColumns[this.s.index] !== undefined ?
                            table.settings()[0].aoColumns[this.s.index]._sManualType :
                            null
                    },
                    {
                        className: 'dtsp-countColumn ' + this.classes.badgePill,
                        data: 'total',
                        targets: 1,
                        visible: false
                    }
                ],
                deferRender: true,
                info: false,
                paging: haveScroller ? true : false,
                scrollY: '200px',
                scroller: haveScroller ? true : false,
                select: true,
                stateSave: table.settings()[0].oFeatures.bStateSave ? true : false
            }, this.c.dtOpts, colOpts !== undefined ? colOpts.dtOpts : {}, (this.customPaneSettings !== null && this.customPaneSettings.dtOpts !== undefined)
                ? this.customPaneSettings.dtOpts
                : {}));
            $(this.dom.dtP).addClass(this.classes.table);
            // This is hacky but necessary for when datatables is generating the column titles automatically
            $(this.dom.searchBox).attr('placeholder', colOpts.header !== undefined
                ? colOpts.header
                : this.colExists
                    ? table.settings()[0].aoColumns[this.s.index].sTitle
                    : this.customPaneSettings.header || 'Custom Pane');
            // As the pane table is not in the document yet we must initialise select ourselves
            $.fn.dataTable.select.init(this.s.dtPane);
            $.fn.dataTable.ext.errMode = errMode;
            // If it is not a custom pane
            if (this.colExists) {
                // On initialisation, do we need to set a filtering value from a
                // saved state or init option?
                var search = column.search();
                search = search ? search.substr(1, search.length - 2).split('|') : [];
                // Count the number of empty cells
                var count_1 = 0;
                rowData.arrayFilter.forEach(function (element) {
                    if (element.filter === '') {
                        count_1++;
                    }
                });
                // Add all of the search options to the pane
                for (var i = 0, ien = rowData.arrayFilter.length; i < ien; i++) {
                    if (rowData.arrayFilter[i] && (rowData.bins[rowData.arrayFilter[i].filter] !== undefined || !this.c.cascadePanes)) {
                        var row = this._addRow(rowData.arrayFilter[i].display, rowData.arrayFilter[i].filter, rowData.bins[rowData.arrayFilter[i].filter], rowData.binsTotal[rowData.arrayFilter[i].filter], rowData.arrayFilter[i].sort, rowData.arrayFilter[i].type);
                        if (colOpts.preSelect !== undefined && colOpts.preSelect.indexOf(rowData.arrayFilter[i].filter) !== -1) {
                            row.select();
                        }
                    }
                    else {
                        this._addRow(this.c.emptyMessage, count_1, count_1, this.c.emptyMessage, this.c.emptyMessage, this.c.emptyMessage);
                    }
                }
            }
            // If there are custom options set or it is a custom pane then get them
            if (colOpts.options !== undefined ||
                (this.customPaneSettings !== null && this.customPaneSettings.options !== undefined)) {
                this._getComparisonRows();
            }
            DataTable.select.init(this.s.dtPane);
            // Display the pane
            this.s.dtPane.draw();
            // When an item is selected on the pane, add these to the array which holds selected items.
            // Custom search will perform.
            this.s.dtPane.on('select.dtsp', function () {
                clearTimeout(t0);
                $(_this.dom.clear).removeClass(_this.classes.dull);
                _this.s.selectPresent = true;
                if (!_this.s.updating) {
                    _this._makeSelection();
                }
                _this.s.selectPresent = false;
            });
            // When saving the state store all of the selected rows for preselection next time around
            this.s.dt.on('stateSaveParams.dtsp', function (e, settings, data) {
                // If the data being passed in is empty then a state clear must have occured so clear the panes state as well
                if ($.isEmptyObject(data)) {
                    _this.s.dtPane.state.clear();
                    return;
                }
                var selected = [];
                var searchTerm;
                var order;
                var bins;
                var arrayFilter;
                // Get all of the data needed for the state save from the pane
                if (_this.s.dtPane !== undefined) {
                    selected = _this.s.dtPane.rows({ selected: true }).data().map(function (item) { return item.filter.toString(); }).toArray();
                    searchTerm = $(_this.dom.searchBox).val();
                    order = _this.s.dtPane.order();
                    bins = rowData.binsOriginal;
                    arrayFilter = rowData.arrayOriginal;
                }
                if (data.searchPanes === undefined) {
                    data.searchPanes = {};
                }
                if (data.searchPanes.panes === undefined) {
                    data.searchPanes.panes = [];
                }
                // Add the panes data to the state object
                data.searchPanes.panes.push({
                    arrayFilter: arrayFilter,
                    bins: bins,
                    id: _this.s.index,
                    order: order,
                    searchTerm: searchTerm,
                    selected: selected
                });
            });
            // Reload the selection, searchbox entry and ordering from the previous state
            if (loadedFilter && loadedFilter.searchPanes && loadedFilter.searchPanes.panes) {
                if (!this.c.cascadePanes) {
                    this._reloadSelect(loadedFilter);
                }
                for (var _i = 0, _a = loadedFilter.searchPanes.panes; _i < _a.length; _i++) {
                    var pane = _a[_i];
                    if (pane.id === this.s.index) {
                        $(this.dom.searchBox).val(pane.searchTerm);
                        this.s.dt.order(pane.order);
                    }
                }
            }
            this.s.dtPane.on('user-select.dtsp', function (e, _dt, type, cell, originalEvent) {
                originalEvent.stopPropagation();
            });
            // When the button to order by the name of the options is clicked then
            //  change the ordering to whatever it isn't currently
            $(this.dom.nameButton).on('click.dtsp', function () {
                var currentOrder = _this.s.dtPane.order()[0][1];
                _this.s.dtPane.order([0, currentOrder === 'asc' ? 'desc' : 'asc']).draw();
            });
            // When the button to order by the number of entries in the column is clicked then
            //  change the ordering to whatever it isn't currently
            $(this.dom.countButton).on('click.dtsp', function () {
                var currentOrder = _this.s.dtPane.order()[0][1];
                _this.s.dtPane.order([1, currentOrder === 'asc' ? 'desc' : 'asc']).draw();
            });
            // When the clear button is clicked reset the pane
            $(this.dom.clear).on('click.dtsp', function () {
                var searches = _this.dom.container.find('.' + _this.classes.search);
                searches.each(function () {
                    // set the value of the search box to be an empty string and then search on that, effectively reseting
                    $(this).val('');
                    $(this).trigger('input');
                });
                _this.clearPane();
            });
            // When the search button is clicked then draw focus to the search box
            $(this.dom.searchButton).on('click.dtsp', function () {
                $(_this.dom.searchBox).focus();
            });
            // When a character is inputted into the searchbox search the pane for matching values.
            // Doing it this way means that no button has to be clicked to trigger a search, it is done asynchronously
            $(this.dom.searchBox).on('input.dtsp', function () {
                _this.s.dtPane.search($(_this.dom.searchBox).val()).draw();
                _this.s.dt.state.save();
            });
            // Declare timeout Variable
            var t0;
            // When an item is deselected on the pane, re add the currently selected items to the array
            // which holds selected items. Custom search will be performed.
            this.s.dtPane.on('deselect.dtsp', function () {
                t0 = setTimeout(function () {
                    _this.s.deselect = true;
                    if (_this.s.dtPane.rows({ selected: true }).data().toArray().length === 0) {
                        $(_this.dom.clear).addClass(_this.classes.dull);
                    }
                    _this._makeSelection();
                    _this.s.deselect = false;
                    _this.s.dt.state.save();
                }, 50);
            });
            // Make sure to save the state once the pane has been built
            this.s.dt.state.save();
            return true;
        };
        /**
         * Update the array which holds the display and filter values for the table
         */
        SearchPane.prototype._detailsPane = function () {
            var _this = this;
            var table = this.s.dt;
            this.s.rowData.arrayTotals = [];
            this.s.rowData.binsTotal = {};
            var settings = this.s.dt.settings()[0];
            table.rows().every(function (rowIdx) {
                _this._populatePaneArray(rowIdx, _this.s.rowData.arrayTotals, settings, _this.s.rowData.binsTotal);
            });
        };
        /**
         * Appends all of the HTML elements to their relevant parent Elements
         */
        SearchPane.prototype._displayPane = function () {
            var container = this.dom.container;
            var colOpts = this.s.colOpts;
            var layVal = parseInt(this.c.layout.split('-')[1], 10);
            //  Empty everything to start again
            $(this.dom.topRow).empty();
            $(this.dom.dtP).empty();
            $(this.dom.topRow).addClass(this.classes.topRow);
            // If there are more than 3 columns defined then make there be a smaller gap between the panes
            if (layVal > 3) {
                $(this.dom.container).addClass(this.classes.smallGap);
            }
            $(this.dom.topRow).addClass(this.classes.subRowsContainer);
            $(this.dom.upper).appendTo(this.dom.topRow);
            $(this.dom.lower).appendTo(this.dom.topRow);
            $(this.dom.searchCont).appendTo(this.dom.upper);
            $(this.dom.buttonGroup).appendTo(this.dom.lower);
            // If no selections have been made in the pane then disable the clear button
            if (this.c.dtOpts.searching === false ||
                (colOpts.dtOpts !== undefined &&
                    colOpts.dtOpts.searching === false) ||
                (!this.c.controls || !colOpts.controls) ||
                (this.customPaneSettings !== null &&
                    this.customPaneSettings.dtOpts !== undefined &&
                    this.customPaneSettings.dtOpts.searching !== undefined &&
                    !this.customPaneSettings.dtOpts.searching)) {
                $(this.dom.searchBox).attr('disabled', 'disabled')
                    .removeClass(this.classes.paneInputButton)
                    .addClass(this.classes.disabledButton);
            }
            $(this.dom.searchBox).appendTo(this.dom.searchCont);
            // Create the contents of the searchCont div. Worth noting that this function will change when using semantic ui
            this._searchContSetup();
            // If the clear button is allowed to show then display it
            if (this.c.clear && this.c.controls && colOpts.controls) {
                $(this.dom.clear).appendTo(this.dom.buttonGroup);
            }
            if (this.c.orderable && colOpts.orderable && this.c.controls && colOpts.controls) {
                $(this.dom.nameButton).appendTo(this.dom.buttonGroup);
            }
            // If the count column is hidden then don't display the ordering button for it
            if (!this.c.hideCount &&
                !colOpts.hideCount &&
                this.c.orderable &&
                colOpts.orderable &&
                this.c.controls &&
                colOpts.controls) {
                $(this.dom.countButton).appendTo(this.dom.buttonGroup);
            }
            $(this.dom.topRow).prependTo(this.dom.container);
            $(container).append(this.dom.dtP);
            $(container).show();
        };
        /**
         * Find the unique filter values in an array
         * @param data empty array to populate with data which has not yet been found
         * @param arrayFilter the array of all of the display and filter values for the table
         */
        SearchPane.prototype._findUnique = function (data, arrayFilter) {
            var prev = [];
            for (var _i = 0, arrayFilter_1 = arrayFilter; _i < arrayFilter_1.length; _i++) {
                var filterEl = arrayFilter_1[_i];
                // If the data has not already been processed then add it to the unique array and the previously processed array.
                if (prev.indexOf(filterEl.filter) === -1) {
                    data.push({
                        display: filterEl.display,
                        filter: filterEl.filter,
                        sort: filterEl.sort,
                        type: filterEl.type
                    });
                    prev.push(filterEl.filter);
                }
            }
        };
        /**
         * Gets the options for the row for the customPanes
         * @returns {object} The options for the row extended to include the options from the user.
         */
        SearchPane.prototype._getBonusOptions = function () {
            // We need to reset the thresholds as if they have a value in colOpts then that value will be used
            var defaultMutator = {
                orthogonal: {
                    threshold: null
                },
                threshold: null
            };
            return $.extend(true, {}, SearchPane.defaults, defaultMutator, this.c !== undefined ? this.c : {});
        };
        /**
         * Adds the custom options to the pane
         * @returns {Array} Returns the array of rows which have been added to the pane
         */
        SearchPane.prototype._getComparisonRows = function () {
            var colOpts = this.s.colOpts;
            // Find the appropriate options depending on whether this is a pane for a specific column or a custom pane
            var options = colOpts.options !== undefined
                ? colOpts.options
                : this.customPaneSettings !== null && this.customPaneSettings.options !== undefined
                    ? this.customPaneSettings.options
                    : undefined;
            if (options === undefined) {
                return;
            }
            var tableVals = this.s.dt.rows({ search: 'applied' }).data().toArray();
            var appRows = this.s.dt.rows({ search: 'applied' });
            var tableValsTotal = this.s.dt.rows().data().toArray();
            var allRows = this.s.dt.rows();
            var rows = [];
            // Clear all of the other rows from the pane, only custom options are to be displayed when they are defined
            this.s.dtPane.clear();
            for (var _i = 0, options_1 = options; _i < options_1.length; _i++) {
                var comp = options_1[_i];
                // Initialise the object which is to be placed in the row
                var insert = comp.label !== '' ? comp.label : this.c.emptyMessage;
                var comparisonObj = {
                    display: insert,
                    filter: typeof comp.value === 'function' ? comp.value : [],
                    shown: 0,
                    sort: insert,
                    total: 0,
                    type: insert
                };
                // If a custom function is in place
                if (typeof comp.value === 'function') {
                    // Count the number of times the function evaluates to true for the data currently being displayed
                    for (var tVal = 0; tVal < tableVals.length; tVal++) {
                        if (comp.value.call(this.s.dt, tableVals[tVal], appRows[0][tVal])) {
                            comparisonObj.shown++;
                        }
                    }
                    // Count the number of times the function evaluates to true for the original data in the Table
                    for (var i = 0; i < tableValsTotal.length; i++) {
                        if (comp.value.call(this.s.dt, tableValsTotal[i], allRows[0][i])) {
                            comparisonObj.total++;
                        }
                    }
                    // Update the comparisonObj
                    if (typeof comparisonObj.filter !== 'function') {
                        comparisonObj.filter.push(comp.filter);
                    }
                }
                // If cascadePanes is not active or if it is and the comparisonObj should be shown then add it to the pane
                if (!this.c.cascadePanes || (this.c.cascadePanes && comparisonObj.shown !== 0)) {
                    rows.push(this._addRow(comparisonObj.display, comparisonObj.filter, comparisonObj.shown, comparisonObj.total, comparisonObj.sort, comparisonObj.type));
                }
            }
            return rows;
        };
        /**
         * Gets the options for the row for the customPanes
         * @returns {object} The options for the row extended to include the options from the user.
         */
        SearchPane.prototype._getOptions = function () {
            var table = this.s.dt;
            // We need to reset the thresholds as if they have a value in colOpts then that value will be used
            var defaultMutator = {
                orthogonal: {
                    threshold: null
                },
                threshold: null
            };
            return $.extend(true, {}, SearchPane.defaults, defaultMutator, table.settings()[0].aoColumns[this.s.index].searchPanes);
        };
        /**
         * This method allows for changes to the panes and table to be made when a selection or a deselection occurs
         * @param select Denotes whether a selection has been made or not
         */
        SearchPane.prototype._makeSelection = function () {
            this.updateTable();
            this.s.updating = true;
            this.s.dt.draw();
            this.s.updating = false;
        };
        /**
         * Fill the array with the values that are currently being displayed in the table
         */
        SearchPane.prototype._populatePane = function () {
            var table = this.s.dt;
            this.s.rowData.arrayFilter = [];
            this.s.rowData.bins = {};
            var settings = this.s.dt.settings()[0];
            // If cascadePanes or viewTotal are active it is necessary to get the data which is currently
            //  being displayed for their functionality.
            var indexArray = (this.c.cascadePanes || this.c.viewTotal) && !this.s.clearing ?
                table.rows({ search: 'applied' }).indexes() :
                table.rows().indexes();
            for (var _i = 0, indexArray_1 = indexArray; _i < indexArray_1.length; _i++) {
                var index = indexArray_1[_i];
                this._populatePaneArray(index, this.s.rowData.arrayFilter, settings);
            }
        };
        /**
         * Populates an array with all of the data for the table
         * @param rowIdx The current row index to be compared
         * @param arrayFilter The array that is to be populated with row Details
         * @param bins The bins object that is to be populated with the row counts
         */
        SearchPane.prototype._populatePaneArray = function (rowIdx, arrayFilter, settings, bins) {
            if (bins === void 0) { bins = this.s.rowData.bins; }
            var colOpts = this.s.colOpts;
            // Retrieve the rendered data from the cell using the fnGetCellData function
            //  rather than the cell().render API method for optimisation
            if (typeof colOpts.orthogonal === 'string') {
                var rendered = settings.oApi._fnGetCellData(settings, rowIdx, this.s.index, colOpts.orthogonal);
                this.s.rowData.filterMap.set(rowIdx, rendered);
                this._addOption(rendered, rendered, rendered, rendered, arrayFilter, bins);
            }
            else {
                var filter = settings.oApi._fnGetCellData(settings, rowIdx, this.s.index, colOpts.orthogonal.search);
                this.s.rowData.filterMap.set(rowIdx, filter);
                if (!bins[filter]) {
                    bins[filter] = 1;
                    this._addOption(filter, settings.oApi._fnGetCellData(settings, rowIdx, this.s.index, colOpts.orthogonal.display), settings.oApi._fnGetCellData(settings, rowIdx, this.s.index, colOpts.orthogonal.sort), settings.oApi._fnGetCellData(settings, rowIdx, this.s.index, colOpts.orthogonal.type), arrayFilter, bins);
                }
                else {
                    bins[filter]++;
                    return;
                }
            }
        };
        /**
         * Reloads all of the previous selects into the panes
         * @param loadedFilter The loaded filters from a previous state
         */
        SearchPane.prototype._reloadSelect = function (loadedFilter) {
            // If the state was not saved don't selected any
            if (loadedFilter === undefined) {
                return;
            }
            var idx;
            // For each pane, check that the loadedFilter list exists and is not null,
            // find the id of each search item and set it to be selected.
            for (var i = 0; i < loadedFilter.searchPanes.panes.length; i++) {
                if (loadedFilter.searchPanes.panes[i].id === this.s.index) {
                    idx = i;
                    break;
                }
            }
            if (idx !== undefined) {
                var table = this.s.dtPane;
                var rows = table.rows({ order: 'index' }).data().map(function (item) { return item.filter !== null ?
                    item.filter.toString() :
                    null; }).toArray();
                for (var _i = 0, _a = loadedFilter.searchPanes.panes[idx].selected; _i < _a.length; _i++) {
                    var filter = _a[_i];
                    var id = -1;
                    if (filter !== null) {
                        id = rows.indexOf(filter.toString());
                    }
                    if (id > -1) {
                        table.row(id).select();
                        this.s.dt.state.save();
                    }
                }
            }
        };
        /**
         * This method decides whether a row should contribute to the pane or not
         * @param filter the value that the row is to be filtered on
         * @param dataIndex the row index
         */
        SearchPane.prototype._search = function (filter, dataIndex) {
            var colOpts = this.s.colOpts;
            var table = this.s.dt;
            // For each item selected in the pane, check if it is available in the cell
            for (var _i = 0, _a = this.selections; _i < _a.length; _i++) {
                var colSelect = _a[_i];
                // if the filter is an array then is the column present in it
                if (Array.isArray(filter)) {
                    if (filter.indexOf(colSelect.filter) !== -1) {
                        return true;
                    }
                }
                // if the filter is a function then does it meet the criteria of that function or not
                else if (typeof colSelect.filter === 'function') {
                    if (colSelect.filter.call(table, table.row(dataIndex).data(), dataIndex)) {
                        if (!this.s.redraw) {
                            this.updatePane();
                        }
                        if (colOpts.combiner === 'or') {
                            return true;
                        }
                    }
                    // If the combiner is an "and" then we need to check against all possible selections
                    //  so if it fails here then the and is not met and return false
                    else if (colOpts.combiner === 'and') {
                        return false;
                    }
                }
                // otherwise if the two filter values are equal then return true
                else if (filter === colSelect.filter) {
                    return true;
                }
            }
            // If the combiner is an and then we need to check against all possible selections
            //  so return true here if so because it would have returned false earlier if it had failed
            if (colOpts.combiner === 'and') {
                return true;
            }
            // Otherwise it hasn't matched with anything by this point so it must be false
            else {
                return false;
            }
        };
        /**
         * Creates the contents of the searchCont div
         *
         * NOTE This is overridden when semantic ui styling in order to integrate the search button into the text box.
         */
        SearchPane.prototype._searchContSetup = function () {
            if (this.c.controls && this.s.colOpts.controls) {
                $(this.dom.searchButton).appendTo(this.dom.searchLabelCont);
            }
            if (!(this.c.dtOpts.searching === false ||
                this.s.colOpts.dtOpts.searching === false ||
                (this.customPaneSettings !== null &&
                    this.customPaneSettings.dtOpts !== undefined &&
                    this.customPaneSettings.dtOpts.searching !== undefined &&
                    !this.customPaneSettings.dtOpts.searching))) {
                $(this.dom.searchLabelCont).appendTo(this.dom.searchCont);
            }
        };
        /**
         * Adds outline to the pane when a selection has been made
         */
        SearchPane.prototype._searchExtras = function () {
            var updating = this.s.updating;
            this.s.updating = true;
            var filters = this.s.dtPane.rows({ selected: true }).data().pluck('filter').toArray();
            var nullIndex = filters.indexOf(this.c.emptyMessage);
            var container = $(this.s.dtPane.table().container());
            // If null index is found then search for empty cells as a filter.
            if (nullIndex > -1) {
                filters[nullIndex] = '';
            }
            // If a filter has been applied then outline the respective pane, remove it when it no longer is.
            if (filters.length > 0) {
                container.addClass(this.classes.selected);
            }
            else if (filters.length === 0) {
                container.removeClass(this.classes.selected);
            }
            this.s.updating = updating;
        };
        /**
         * Finds the ratio of the number of different options in the table to the number of rows
         * @param bins the number of different options in the table
         * @param rowCount the total number of rows in the table
         * @returns {number} returns the ratio
         */
        SearchPane.prototype._uniqueRatio = function (bins, rowCount) {
            if (rowCount > 0) {
                return bins / rowCount;
            }
            else {
                return 1;
            }
        };
        /**
         * updates the options within the pane
         * @param draw a flag to define whether this has been called due to a draw event or not
         */
        SearchPane.prototype._updateCommon = function (draw) {
            if (draw === void 0) { draw = false; }
            // Update the panes if doing a deselect. if doing a select then
            // update all of the panes except for the one causing the change
            if (this.s.dtPane !== undefined &&
                ((!this.s.filteringActive || this.c.cascadePanes) || draw === true) &&
                (this.c.cascadePanes !== true || this.s.selectPresent !== true) && !this.s.lastSelect) {
                var colOpts = this.s.colOpts;
                var selected = this.s.dtPane.rows({ selected: true }).data().toArray();
                var scrollTop = $(this.s.dtPane.table().node()).parent()[0].scrollTop;
                var rowData = this.s.rowData;
                // Clear the pane in preparation for adding the updated search options
                this.s.dtPane.clear();
                // If it is not a custom pane
                if (this.colExists) {
                    // Only run populatePane if the data has not been collected yet
                    if (rowData.arrayFilter.length === 0) {
                        this._populatePane();
                    }
                    // If cascadePanes is active and the table has returned to its default state then
                    //  there is a need to update certain parts ofthe rowData.
                    else if (this.c.cascadePanes
                        && this.s.dt.rows().data().toArray().length === this.s.dt.rows({ search: 'applied' }).data().toArray().length) {
                        rowData.arrayFilter = rowData.arrayOriginal;
                        rowData.bins = rowData.binsOriginal;
                    }
                    // Otherwise if viewTotal or cascadePanes is active then the data from the table must be read.
                    else if (this.c.viewTotal || this.c.cascadePanes) {
                        this._populatePane();
                    }
                    // If the viewTotal option is selected then find the totals for the table
                    if (this.c.viewTotal) {
                        this._detailsPane();
                    }
                    else {
                        rowData.binsTotal = rowData.bins;
                    }
                    if (this.c.viewTotal && !this.c.cascadePanes) {
                        rowData.arrayFilter = rowData.arrayTotals;
                    }
                    var _loop_1 = function (dataP) {
                        // If both view Total and cascadePanes have been selected and the count of the row is not 0 then add it to pane
                        // Do this also if the viewTotal option has been selected and cascadePanes has not
                        if (dataP && ((rowData.bins[dataP.filter] !== undefined && rowData.bins[dataP.filter] !== 0 && this_1.c.cascadePanes)
                            || !this_1.c.cascadePanes
                            || this_1.s.clearing)) {
                            var row = this_1._addRow(dataP.display, dataP.filter, !this_1.c.viewTotal
                                ? rowData.bins[dataP.filter]
                                : rowData.bins[dataP.filter] !== undefined
                                    ? rowData.bins[dataP.filter]
                                    : 0, this_1.c.viewTotal
                                ? String(rowData.binsTotal[dataP.filter])
                                : rowData.bins[dataP.filter], dataP.sort, dataP.type);
                            // Find out if the filter was selected in the previous search, if so select it and remove from array.
                            var selectIndex = selected.findIndex(function (element) {
                                return element.filter === dataP.filter;
                            });
                            if (selectIndex !== -1) {
                                row.select();
                                selected.splice(selectIndex, 1);
                            }
                        }
                    };
                    var this_1 = this;
                    for (var _i = 0, _a = rowData.arrayFilter; _i < _a.length; _i++) {
                        var dataP = _a[_i];
                        _loop_1(dataP);
                    }
                }
                if ((colOpts.searchPanes !== undefined && colOpts.searchPanes.options !== undefined) ||
                    colOpts.options !== undefined ||
                    (this.customPaneSettings !== null && this.customPaneSettings.options !== undefined)) {
                    var rows = this._getComparisonRows();
                    var _loop_2 = function (row) {
                        var selectIndex = selected.findIndex(function (element) {
                            if (element.display === row.data().display) {
                                return true;
                            }
                        });
                        if (selectIndex !== -1) {
                            row.select();
                            selected.splice(selectIndex, 1);
                        }
                    };
                    for (var _b = 0, rows_1 = rows; _b < rows_1.length; _b++) {
                        var row = rows_1[_b];
                        _loop_2(row);
                    }
                }
                // Add search options which were previously selected but whos results are no
                // longer present in the resulting data set.
                for (var _c = 0, selected_1 = selected; _c < selected_1.length; _c++) {
                    var selectedEl = selected_1[_c];
                    var row = this._addRow(selectedEl.display, selectedEl.filter, 0, this.c.viewTotal
                        ? selectedEl.total
                        : 0, selectedEl.filter, selectedEl.filter);
                    row.select();
                }
                this.s.dtPane.draw();
                this.s.dtPane.table().node().parentNode.scrollTop = scrollTop;
            }
        };
        SearchPane.version = '1.0.1';
        SearchPane.classes = {
            buttonGroup: 'dtsp-buttonGroup',
            buttonSub: 'dtsp-buttonSub',
            clear: 'dtsp-clear',
            clearAll: 'dtsp-clearAll',
            clearButton: 'clearButton',
            container: 'dtsp-searchPane',
            countButton: 'dtsp-countButton',
            disabledButton: 'dtsp-disabledButton',
            dull: 'dtsp-dull',
            hidden: 'dtsp-hidden',
            hide: 'dtsp-hide',
            layout: 'dtsp-',
            name: 'dtsp-name',
            nameButton: 'dtsp-nameButton',
            narrow: 'dtsp-narrow',
            paneButton: 'dtsp-paneButton',
            paneInputButton: 'dtsp-paneInputButton',
            pill: 'dtsp-pill',
            search: 'dtsp-search',
            searchCont: 'dtsp-searchCont',
            searchIcon: 'dtsp-searchIcon',
            searchLabelCont: 'dtsp-searchButtonCont',
            selected: 'dtsp-selected',
            smallGap: 'dtsp-smallGap',
            subRow1: 'dtsp-subRow1',
            subRow2: 'dtsp-subRow2',
            subRowsContainer: 'dtsp-subRowsContainer',
            title: 'dtsp-title',
            topRow: 'dtsp-topRow'
        };
        // Define SearchPanes default options
        SearchPane.defaults = {
            cascadePanes: false,
            clear: true,
            combiner: 'or',
            controls: true,
            container: function (dt) {
                return dt.table().container();
            },
            dataLength: 30,
            dtOpts: {},
            emptyMessage: '<i>No Data</i>',
            hideCount: false,
            layout: 'columns-3',
            orderable: true,
            orthogonal: {
                display: 'display',
                hideCount: false,
                search: 'filter',
                show: undefined,
                sort: 'sort',
                threshold: 0.6,
                type: 'type'
            },
            preSelect: [],
            threshold: 0.6,
            viewTotal: false
        };
        return SearchPane;
    }());

    var DataTable$1 = $.fn.dataTable;
    var SearchPanes = /** @class */ (function () {
        function SearchPanes(paneSettings, opts, fromInit) {
            var _this = this;
            if (fromInit === void 0) { fromInit = false; }
            this.regenerating = false;
            // Check that the required version of DataTables is included
            if (!DataTable$1 || !DataTable$1.versionCheck || !DataTable$1.versionCheck('1.10.0')) {
                throw new Error('SearchPane requires DataTables 1.10 or newer');
            }
            // Check that Select is included
            if (!DataTable$1.select) {
                throw new Error('SearchPane requires Select');
            }
            var table = new DataTable$1.Api(paneSettings);
            this.classes = $.extend(true, {}, SearchPanes.classes);
            // Get options from user
            this.c = $.extend(true, {}, SearchPanes.defaults, opts);
            // Add extra elements to DOM object including clear
            this.dom = {
                clearAll: $('<button type="button">Clear All</button>').addClass(this.classes.clearAll),
                container: $('<div/>').addClass(this.classes.panes).text(table.i18n('searchPanes.loadMessage', 'Loading Search Panes...')),
                emptyMessage: $('<div/>').addClass(this.classes.emptyMessage),
                options: $('<div/>').addClass(this.classes.container),
                panes: $('<div/>').addClass(this.classes.container),
                title: $('<div/>').addClass(this.classes.title),
                titleRow: $('<div/>').addClass(this.classes.titleRow),
                wrapper: $('<div/>')
            };
            this.s = {
                colOpts: [],
                dt: table,
                filterPane: -1,
                panes: [],
                selectionList: [],
                updating: false
            };
            table.settings()[0]._searchPanes = this;
            this.dom.clearAll.text(table.i18n('searchPanes.clearMessage', 'Clear All'));
            this._getState();
            if (this.s.dt.settings()[0]._bInitComplete || fromInit) {
                this._paneDeclare(table, paneSettings, opts);
            }
            else {
                table.on('preInit.dt', function () {
                    _this._paneDeclare(table, paneSettings, opts);
                });
            }
        }
        /**
         * Clear the selections of all of the panes
         */
        SearchPanes.prototype.clearSelections = function () {
            // Load in all of the searchBoxes in the documents
            var searches = this.dom.container.find(this.classes.search);
            // For each searchBox set the input text to be empty and then trigger
            //  an input on them so that they no longer filter the panes
            searches.each(function () {
                $(this).val('');
                $(this).trigger('input');
            });
            var returnArray = [];
            // For every pane, clear the selections in the pane
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                if (pane.s.dtPane !== undefined) {
                    returnArray.push(pane.clearPane());
                }
            }
            this.s.dt.draw();
            return returnArray;
        };
        /**
         * returns the container node for the searchPanes
         */
        SearchPanes.prototype.getNode = function () {
            return this.dom.container;
        };
        /**
         * rebuilds all of the panes
         */
        SearchPanes.prototype.rebuild = function (targetIdx) {
            if (targetIdx === void 0) { targetIdx = false; }
            $(this.dom.emptyMessage).remove();
            // As a rebuild from scratch is required, empty the searchpanes container.
            var returnArray = [];
            this.clearSelections();
            // Rebuild each pane individually, if a specific pane has been selected then only rebuild that one
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                if (targetIdx !== false && pane.s.index !== targetIdx) {
                    continue;
                }
                pane.clearData();
                returnArray.push(pane.rebuildPane());
            }
            // Attach panes, clear buttons, and title bar to the document
            this._updateFilterCount();
            this._attachPaneContainer();
            // If a single pane has been rebuilt then return only that pane
            if (returnArray.length === 1) {
                return returnArray[0];
            }
            // Otherwise return all of the panes that have been rebuilt
            else {
                return returnArray;
            }
        };
        /**
         * Redraws all of the panes
         */
        SearchPanes.prototype.redrawPanes = function () {
            var table = this.s.dt;
            // Only do this if the redraw isn't being triggered by the panes updating themselves
            if (!this.s.updating) {
                var filterActive = true;
                var filterPane = this.s.filterPane;
                // If the number of rows currently visible is equal to the number of rows in the table
                //  then there can't be any filtering taking place
                if (table.rows({ search: 'applied' }).data().toArray().length === table.rows().data().toArray().length) {
                    filterActive = false;
                }
                // Otherwise if viewTotal is active then it is necessary to determine which panes a select is present in.
                //  If there is only one pane with a selection present then it should not show the filtered message as
                //  more selections may be made in that pane.
                else if (this.c.viewTotal) {
                    for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                        var pane = _a[_i];
                        if (pane.s.dtPane !== undefined) {
                            var selectLength = pane.s.dtPane.rows({ selected: true }).data().toArray().length;
                            // If filterPane === -1 then a pane with a selection has not been found yet, so set filterPane to that panes index
                            if (selectLength > 0 && filterPane === -1) {
                                filterPane = pane.s.index;
                            }
                            // Then if another pane is found with a selection then set filterPane to null to
                            //  show that multiple panes have selections present
                            else if (selectLength > 0) {
                                filterPane = null;
                            }
                        }
                    }
                }
                var deselectIdx = void 0;
                var newSelectionList = [];
                // Don't run this if it is due to the panes regenerating
                if (!this.regenerating) {
                    for (var _b = 0, _c = this.s.panes; _b < _c.length; _b++) {
                        var pane = _c[_b];
                        // Identify the pane where a selection or deselection has been made and add it to the list.
                        if (pane.s.selectPresent) {
                            this.s.selectionList.push({ index: pane.s.index, rows: pane.s.dtPane.rows({ selected: true }).data().toArray(), protect: false });
                            table.state.save();
                            break;
                        }
                        else if (pane.s.deselect) {
                            deselectIdx = pane.s.index;
                            var selectedData = pane.s.dtPane.rows({ selected: true }).data().toArray();
                            if (selectedData.length > 0) {
                                this.s.selectionList.push({ index: pane.s.index, rows: selectedData, protect: true });
                            }
                        }
                    }
                    if (this.s.selectionList.length > 0) {
                        var last = this.s.selectionList[this.s.selectionList.length - 1].index;
                        for (var _d = 0, _e = this.s.panes; _d < _e.length; _d++) {
                            var pane = _e[_d];
                            pane.s.lastSelect = (pane.s.index === last && this.s.selectionList.length === 1);
                        }
                    }
                    // Remove selections from the list from the pane where a deselect has taken place
                    for (var i = 0; i < this.s.selectionList.length; i++) {
                        if (this.s.selectionList[i].index !== deselectIdx || this.s.selectionList[i].protect === true) {
                            var further = false;
                            // Find out if this selection is the last one in the list for that pane
                            for (var j = i + 1; j < this.s.selectionList.length; j++) {
                                if (this.s.selectionList[j].index === this.s.selectionList[i].index) {
                                    further = true;
                                }
                            }
                            // If there are no selections for this pane in the list then just push this one
                            if (!further) {
                                newSelectionList.push(this.s.selectionList[i]);
                                this.s.selectionList[i].protect = false;
                            }
                        }
                    }
                    // Update all of the panes to reflect the current state of the filters
                    for (var _f = 0, _g = this.s.panes; _f < _g.length; _f++) {
                        var pane = _g[_f];
                        if (pane.s.dtPane !== undefined) {
                            var tempFilter = true;
                            pane.s.filteringActive = true;
                            if ((filterPane !== -1 && filterPane !== null && filterPane === pane.s.index) || filterActive === false) {
                                tempFilter = false;
                                pane.s.filteringActive = false;
                            }
                            pane.updatePane(!tempFilter ? false : filterActive);
                        }
                    }
                    // Update the label that shows how many filters are in place
                    this._updateFilterCount();
                    // If the length of the selections are different then some of them have been removed and a deselect has occured
                    if (newSelectionList.length > 0 && newSelectionList.length < this.s.selectionList.length) {
                        this._cascadeRegen(newSelectionList);
                        var last = newSelectionList[newSelectionList.length - 1].index;
                        for (var _h = 0, _j = this.s.panes; _h < _j.length; _h++) {
                            var pane = _j[_h];
                            pane.s.lastSelect = (pane.s.index === last && this.s.selectionList.length === 1);
                        }
                    }
                    else if (newSelectionList.length > 0) {
                        // Update all of the other panes as you would just making a normal selection
                        for (var _k = 0, _l = this.s.panes; _k < _l.length; _k++) {
                            var paneUpdate = _l[_k];
                            if (paneUpdate.s.dtPane !== undefined) {
                                var tempFilter = true;
                                paneUpdate.s.filteringActive = true;
                                if ((filterPane !== -1 && filterPane !== null && filterPane === paneUpdate.s.index) || filterActive === false) {
                                    tempFilter = false;
                                    paneUpdate.s.filteringActive = false;
                                }
                                paneUpdate.updatePane(!tempFilter ? tempFilter : filterActive);
                            }
                        }
                    }
                }
                else {
                    for (var _m = 0, _o = this.s.panes; _m < _o.length; _m++) {
                        var pane = _o[_m];
                        if (pane.s.dtPane !== undefined) {
                            var tempFilter = true;
                            pane.s.filteringActive = true;
                            if ((filterPane !== -1 && filterPane !== null && filterPane === pane.s.index) || filterActive === false) {
                                tempFilter = false;
                                pane.s.filteringActive = false;
                            }
                            pane.updatePane(!tempFilter ? tempFilter : filterActive);
                        }
                    }
                    // Update the label that shows how many filters are in place
                    this._updateFilterCount();
                }
                if (!filterActive) {
                    this.s.selectionList = [];
                }
            }
        };
        /**
         * Attach the panes, buttons and title to the document
         */
        SearchPanes.prototype._attach = function () {
            $(this.dom.container).removeClass(this.classes.hide);
            $(this.dom.titleRow).removeClass(this.classes.hide);
            $(this.dom.titleRow).remove();
            $(this.dom.title).appendTo(this.dom.titleRow);
            // If the clear button is permitted attach it
            if (this.c.clear) {
                $(this.dom.clearAll).appendTo(this.dom.titleRow);
            }
            $(this.dom.titleRow).appendTo(this.dom.container);
            // Attach the container for each individual pane to the overall container
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                $(pane.dom.container).appendTo(this.dom.panes);
            }
            // Attach everything to the document
            $(this.dom.panes).appendTo(this.dom.container);
            if ($('div.' + this.classes.container).length === 0) {
                $(this.dom.container).prependTo(this.s.dt);
            }
            return this.dom.container;
        };
        /**
         * Attach the top row containing the filter count and clear all button
         */
        SearchPanes.prototype._attachExtras = function () {
            $(this.dom.container).removeClass(this.classes.hide);
            $(this.dom.titleRow).removeClass(this.classes.hide);
            $(this.dom.titleRow).remove();
            $(this.dom.title).appendTo(this.dom.titleRow);
            // If the clear button is permitted attach it
            if (this.c.clear) {
                $(this.dom.clearAll).appendTo(this.dom.titleRow);
            }
            $(this.dom.titleRow).appendTo(this.dom.container);
            return this.dom.container;
        };
        /**
         * If there are no panes to display then this method is called to either
         *   display a message in their place or hide them completely.
         */
        SearchPanes.prototype._attachMessage = function () {
            // Create a message to display on the screen
            var message;
            try {
                message = this.s.dt.i18n('searchPanes.emptyPanes', 'No SearchPanes');
            }
            catch (error) {
                message = null;
            }
            // If the message is an empty string then searchPanes.emptyPanes is undefined,
            //  therefore the pane container should be removed from the display
            if (message === null) {
                $(this.dom.container).addClass(this.classes.hide);
                $(this.dom.titleRow).removeClass(this.classes.hide);
                return;
            }
            else {
                $(this.dom.container).removeClass(this.classes.hide);
                $(this.dom.titleRow).addClass(this.classes.hide);
            }
            // Otherwise display the message
            $(this.dom.emptyMessage).text(message);
            this.dom.emptyMessage.appendTo(this.dom.container);
            return this.dom.container;
        };
        /**
         * Attaches the panes to the document and displays a message or hides if there are none
         */
        SearchPanes.prototype._attachPaneContainer = function () {
            // If a pane is to be displayed then attach the normal pane output
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                if (pane.s.displayed === true) {
                    return this._attach();
                }
            }
            // Otherwise attach the custom message or remove the container from the display
            return this._attachMessage();
        };
        /**
         * Prepares the panes for selections to be made when cascade is active and a deselect has occured
         * @param newSelectionList the list of selections which are to be made
         */
        SearchPanes.prototype._cascadeRegen = function (newSelectionList) {
            // Set this to true so that the actions taken do not cause this to run until it is finished
            this.regenerating = true;
            // If only one pane has been selected then take note of its index
            var solePane = -1;
            if (newSelectionList.length === 1) {
                solePane = newSelectionList[0].index;
            }
            // Let the pane know that a cascadeRegen is taking place to avoid unexpected behaviour
            //  and clear all of the previous selections in the pane
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                pane.setCascadeRegen(true);
                pane.setClear(true);
                // If this is the same as the pane with the only selection then pass it as a parameter into clearPane
                if ((pane.s.dtPane !== undefined && pane.s.index === solePane) || pane.s.dtPane !== undefined) {
                    pane.clearPane();
                }
                pane.setClear(false);
            }
            // Remake Selections
            this._makeCascadeSelections(newSelectionList);
            // Set the selection list property to be the list without the selections from the deselect pane
            this.s.selectionList = newSelectionList;
            // The regeneration of selections is over so set it back to false
            for (var _b = 0, _c = this.s.panes; _b < _c.length; _b++) {
                var pane = _c[_b];
                pane.setCascadeRegen(false);
            }
            this.regenerating = false;
        };
        /**
         * Attaches the message to the document but does not add any panes
         */
        SearchPanes.prototype._checkMessage = function () {
            // If a pane is to be displayed then attach the normal pane output
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                if (pane.s.displayed === true) {
                    return;
                }
            }
            // Otherwise attach the custom message or remove the container from the display
            return this._attachMessage();
        };
        /**
         * Gets the selection list from the previous state and stores it in the selectionList Property
         */
        SearchPanes.prototype._getState = function () {
            var loadedFilter = this.s.dt.state.loaded();
            if (loadedFilter && loadedFilter.searchPanes && loadedFilter.searchPanes.selectionList !== undefined) {
                this.s.selectionList = loadedFilter.searchPanes.selectionList;
            }
        };
        /**
         * Makes all of the selections when cascade is active
         * @param newSelectionList the list of selections to be made, in the order they were originally selected
         */
        SearchPanes.prototype._makeCascadeSelections = function (newSelectionList) {
            // make selections in the order they were made previously, excluding those from the pane where a deselect was made
            for (var _i = 0, newSelectionList_1 = newSelectionList; _i < newSelectionList_1.length; _i++) {
                var selection = newSelectionList_1[_i];
                var _loop_1 = function (pane) {
                    if (pane.s.index === selection.index && pane.s.dtPane !== undefined) {
                        // if there are any selections currently in the pane then deselect them as we are about to make our new selections
                        if (pane.s.dtPane.rows({ selected: true }).data().toArray().length > 0 && pane.s.dtPane !== undefined) {
                            pane.setClear(true);
                            pane.clearPane();
                            pane.setClear(false);
                        }
                        var _loop_2 = function (row) {
                            pane.s.dtPane.rows().every(function (rowIdx) {
                                if (pane.s.dtPane.row(rowIdx).data().filter === row.filter) {
                                    pane.s.dtPane.row(rowIdx).select();
                                }
                            });
                        };
                        // select every row in the pane that was selected previously
                        for (var _i = 0, _a = selection.rows; _i < _a.length; _i++) {
                            var row = _a[_i];
                            _loop_2(row);
                        }
                        // Update the label that shows how many filters are in place
                        this_1._updateFilterCount();
                    }
                };
                var this_1 = this;
                // As the selections may have been made across the panes in a different order to the pane index we must identify
                //  which pane has the index of the selection. This is also important for colreorder etc
                for (var _a = 0, _b = this.s.panes; _a < _b.length; _a++) {
                    var pane = _b[_a];
                    _loop_1(pane);
                }
            }
            // Make sure that the state is saved after all of these selections
            this.s.dt.state.save();
        };
        /**
         * Declares the instances of individual searchpanes dependant on the number of columns.
         * It is necessary to run this once preInit has completed otherwise no panes will be
         *  created as the column count will be 0.
         * @param table the DataTable api for the parent table
         * @param paneSettings the settings passed into the constructor
         * @param opts the options passed into the constructor
         */
        SearchPanes.prototype._paneDeclare = function (table, paneSettings, opts) {
            var _this = this;
            // Create Panes
            table
                .columns(this.c.columns.length > 0 ? this.c.columns : undefined)
                .eq(0)
                .each(function (idx) {
                _this.s.panes.push(new SearchPane(paneSettings, opts, idx, _this.c.layout, _this.dom.panes));
            });
            // If there is any extra custom panes defined then create panes for them too
            var rowLength = table.columns().eq(0).toArray().length;
            var paneLength = this.c.panes.length;
            for (var i = 0; i < paneLength; i++) {
                var id = rowLength + i;
                this.s.panes.push(new SearchPane(paneSettings, opts, id, this.c.layout, this.dom.panes, this.c.panes[i]));
            }
            // If this internal property is true then the DataTable has been initialised already
            if (this.s.dt.settings()[0]._bInitComplete) {
                this._paneStartup(table);
            }
            else {
                // Otherwise add the paneStartup function to the list of functions that are to be run when the table is initialised
                // This will garauntee that the panes are initialised before the init event and init Complete callback is fired
                this.s.dt.settings()[0].aoInitComplete.push({ fn: function () {
                        _this._paneStartup(table);
                    } });
            }
        };
        /**
         * Runs the start up functions for the panes to enable listeners and populate panes
         * @param table the DataTable api for the parent Table
         */
        SearchPanes.prototype._paneStartup = function (table) {
            var _this = this;
            // Magic number of 500 is a guess at what will be fast
            if (this.s.dt.page.info().recordsTotal <= 500) {
                this._startup(table);
            }
            else {
                setTimeout(function () {
                    _this._startup(table);
                }, 100);
            }
        };
        /**
         * Initialises the tables previous/preset selections and initialises callbacks for events
         * @param table the parent table for which the searchPanes are being created
         */
        SearchPanes.prototype._startup = function (table) {
            var _this = this;
            $(this.dom.container).text('');
            // Attach clear button and title bar to the document
            this._attachExtras();
            $(this.dom.container).append(this.dom.panes);
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                pane.rebuildPane();
            }
            this._updateFilterCount();
            this._checkMessage();
            // When a draw is called on the DataTable, update all of the panes incase the data in the DataTable has changed
            table.on('draw.dtsps', function () {
                _this._updateFilterCount();
                if (_this.c.cascadePanes || _this.c.viewTotal) {
                    _this.redrawPanes();
                }
                _this.s.filterPane = -1;
            });
            // Whenever a state save occurs store the selection list in the state object
            this.s.dt.on('stateSaveParams.dtsp', function (e, settings, data) {
                if (data.searchPanes === undefined) {
                    data.searchPanes = {};
                }
                data.searchPanes.selectionList = _this.s.selectionList;
            });
            // If cascadePanes is active then make the previous selections in the order they were previously
            if (this.s.selectionList.length > 0 && this.c.cascadePanes) {
                this._cascadeRegen(this.s.selectionList);
            }
            // PreSelect any selections which have been defined using the preSelect option
            table
                .columns(this.c.columns.length > 0 ? this.c.columns : undefined)
                .eq(0)
                .each(function (idx) {
                if (_this.s.panes[idx] !== undefined &&
                    _this.s.panes[idx].s.dtPane !== undefined &&
                    _this.s.panes[idx].s.colOpts.preSelect !== undefined) {
                    var tableLength = _this.s.panes[idx].s.dtPane.rows().data().toArray().length;
                    for (var i = 0; i < tableLength; i++) {
                        if (_this.s.panes[idx].s.colOpts.preSelect.indexOf(_this.s.panes[idx].s.dtPane.cell(i, 0).data()) !== -1) {
                            _this.s.panes[idx].s.dtPane.row(i).select();
                            _this.s.panes[idx].updateTable();
                        }
                    }
                }
            });
            // Update the title bar to show how many filters have been selected
            this._updateFilterCount();
            // If the table is destroyed and restarted then clear the selections so that they do not persist.
            table.on('destroy.dtsps', function () {
                for (var _i = 0, _a = _this.s.panes; _i < _a.length; _i++) {
                    var pane = _a[_i];
                    pane.destroy();
                }
                table.off('.dtsps');
                $(_this.dom.clearAll).off('.dtsps');
                $(_this.dom.container).remove();
                _this.clearSelections();
            });
            // When the clear All button has been pressed clear all of the selections in the panes
            if (this.c.clear) {
                $(this.dom.clearAll).on('click.dtsps', function () {
                    _this.clearSelections();
                });
            }
            table.settings()[0]._searchPanes = this;
        };
        /**
         * Updates the number of filters that have been applied in the title
         */
        SearchPanes.prototype._updateFilterCount = function () {
            var filterCount = 0;
            // Add the number of all of the filters throughout the panes
            for (var _i = 0, _a = this.s.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                if (pane.s.dtPane !== undefined) {
                    filterCount += pane.getPaneCount();
                }
            }
            // Run the message through the internationalisation method to improve readability
            var message = this.s.dt.i18n('searchPanes.title', 'Filters Active - %d', filterCount);
            $(this.dom.title).text(message);
        };
        SearchPanes.version = '1.0.1';
        SearchPanes.classes = {
            clear: 'dtsp-clear',
            clearAll: 'dtsp-clearAll',
            container: 'dtsp-searchPanes',
            emptyMessage: 'dtsp-emptyMessage',
            hide: 'dtsp-hidden',
            panes: 'dtsp-panesContainer',
            search: 'dtsp-search',
            title: 'dtsp-title',
            titleRow: 'dtsp-titleRow'
        };
        // Define SearchPanes default options
        SearchPanes.defaults = {
            cascadePanes: false,
            clear: true,
            container: function (dt) {
                return dt.table().container();
            },
            columns: [],
            layout: 'columns-3',
            panes: [],
            viewTotal: false
        };
        return SearchPanes;
    }());

    /*! SearchPanes 1.0.1
     * 2019-2020 SpryMedia Ltd - datatables.net/license
     */
    // DataTables extensions common UMD. Note that this allows for AMD, CommonJS
    // (with window and jQuery being allowed as parameters to the returned
    // function) or just default browser loading.
    (function (factory) {
        if (typeof define === 'function' && define.amd) {
            // AMD
            define(['jquery', 'datatables.net'], function ($) {
                return factory($, window, document);
            });
        }
        else if (typeof exports === 'object') {
            // CommonJS
            module.exports = function (root, $) {
                if (!root) {
                    root = window;
                }
                if (!$ || !$.fn.dataTable) {
                    $ = require('datatables.net')(root, $).$;
                }
                return factory($, root, root.document);
            };
        }
        else {
            // Browser - assume jQuery has already been loaded
            factory(window.jQuery, window, document);
        }
    }(function ($, window, document) {
        var DataTable = $.fn.dataTable;
        $.fn.dataTable.SearchPanes = SearchPanes;
        $.fn.DataTable.SearchPanes = SearchPanes;
        $.fn.dataTable.SearchPane = SearchPane;
        $.fn.DataTable.SearchPane = SearchPane;
        DataTable.Api.register('searchPanes.rebuild()', function () {
            return this.iterator('table', function () {
                if (this.searchPanes) {
                    this.searchPanes.rebuild();
                }
            });
        });
        DataTable.Api.register('column().paneOptions()', function (options) {
            return this.iterator('column', function (idx) {
                var col = this.aoColumns[idx];
                if (!col.searchPanes) {
                    col.searchPanes = {};
                }
                col.searchPanes.values = options;
                if (this.searchPanes) {
                    this.searchPanes.rebuild();
                }
            });
        });
        var apiRegister = $.fn.dataTable.Api.register;
        apiRegister('searchPanes()', function () {
            return this;
        });
        apiRegister('searchPanes.clearSelections()', function () {
            var ctx = this.context[0];
            ctx._searchPanes.clearSelections();
            return this;
        });
        apiRegister('searchPanes.rebuildPane()', function (targetIdx) {
            var ctx = this.context[0];
            ctx._searchPanes.rebuild(targetIdx);
            return this;
        });
        apiRegister('searchPanes.container()', function () {
            var ctx = this.context[0];
            return ctx._searchPanes.getNode();
        });
        $.fn.dataTable.ext.buttons.searchPanesClear = {
            text: 'Clear Panes',
            action: function (e, dt, node, config) {
                dt.searchPanes.clearSelections();
            }
        };
        $.fn.dataTable.ext.buttons.searchPanes = {
            text: 'Search Panes',
            init: function (dt, node, config) {
                var panes = new $.fn.dataTable.SearchPanes(dt, {
                    filterChanged: function (count) {
                        dt.button(node).text(dt.i18n('searchPanes.collapse', { 0: 'SearchPanes', _: 'SearchPanes (%d)' }, count));
                    }
                });
                var message = dt.i18n('searchPanes.collapse', 'SearchPanes');
                dt.button(node).text(message);
                config._panes = panes;
            },
            action: function (e, dt, node, config) {
                e.stopPropagation();
                this.popover(config._panes.getNode(), {
                    align: 'dt-container'
                });
                config._panes.adjust();
            }
        };
        function _init(settings, fromPre) {
            if (fromPre === void 0) { fromPre = false; }
            var api = new DataTable.Api(settings);
            var opts = api.init().searchPanes || DataTable.defaults.searchPanes;
            var searchPanes = new SearchPanes(api, opts, fromPre);
            var node = searchPanes.getNode();
            return node;
        }
        // Attach a listener to the document which listens for DataTables initialisation
        // events so we can automatically initialise
        $(document).on('preInit.dt.dtsp', function (e, settings, json) {
            if (e.namespace !== 'dt') {
                return;
            }
            if (settings.oInit.searchPanes ||
                DataTable.defaults.searchPanes) {
                if (!settings._searchPanes) {
                    _init(settings, true);
                }
            }
        });
        // DataTables `dom` feature option
        DataTable.ext.feature.push({
            cFeature: 'P',
            fnInit: _init
        });
        // DataTables 2 layout feature
        if (DataTable.ext.features) {
            DataTable.ext.features.register('searchPanes', _init);
        }
    }));

}());


