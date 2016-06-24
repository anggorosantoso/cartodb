var _ = require('underscore');
var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./intersection-form.tpl');
var ColumnOptions = require('../column-options');

var AGGREGATE_INTERSECTION_FIELDS = 'type,aggregate_function,aggregate_column';
var INTERSECTION_FIELDS = 'type';
/**
 * Form model for the intersection analysis
 */
module.exports = BaseAnalysisFormModel.extend({
  initialize: function () {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);

    var nodeDefModel = this._layerDefinitionModel.findAnalysisDefinitionNodeModel(this.get('source'));

    this._columnOptions = new ColumnOptions({}, {
      nodeDefModel: nodeDefModel
    });

    this.listenTo(this._columnOptions, 'columnsFetched', this._setSchema);

    this.on('change:type', this._setSchema, this);

    this._setSchema();
  },

  _getFormFieldNames: function () {
    return this.get('type') === 'aggregate-intersection'
      ? AGGREGATE_INTERSECTION_FIELDS
      : INTERSECTION_FIELDS;
  },

  _formatAttrs: function (formAttrs) {
    var customFormattedFormAttrs = _.pick(formAttrs, ['id', 'source', 'target'].concat(this._getFormFieldNames().split(',')));
    return BaseAnalysisFormModel.prototype._formatAttrs.call(this, customFormattedFormAttrs);
  },

  getTemplate: function () {
    return template;
  },

  getTemplateData: function () {
    return {
      dataFields: this._getFormFieldNames()
    };
  },

  _filterSchemaFieldsByType: function (schema) {
    // Always include the source and target fields in addition to the type-specific fields
    return _.pick(schema, ['source', 'target'].concat(this._getFormFieldNames().split(',')));
  },

  /**
   * @override {BaseAnalysisFormModel._setSchema}
   */
  _setSchema: function () {
    BaseAnalysisFormModel.prototype._setSchema.call(this, this._filterSchemaFieldsByType({
      source: {
        type: 'Select',
        text: _t('editor.layers.analysis-form.source'),
        options: [ this.get('source') ],
        editorAttrs: { disabled: true }
      },
      target: {
        type: 'Select',
        text: _t('editor.layers.analysis-form.source'),
        options: this._getTargetNodes(),
        validators: ['required']
      },
      type: {
        type: 'Radio',
        text: _t('editor.layers.analysis-form.source'),
        options: [
          { label: 'Filter', val: 'intersection' },
          { label: 'Aggregate', val: 'aggregate-intersection' }
        ]
      },
      aggregate_column: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.column'),
        options: this._columnOptions.filterByType('number'),
        validators: ['required']
      },
      aggregate_function: {
        type: 'Select',
        title: _t('editor.layers.analysis-form.operation'),
        options: ['sum', 'avg', 'min', 'max'],
        validators: ['required']
      }
    }));
  },

  _getTargetNodes: function () {
    var letter = this._layerDefinitionModel.get('letter');
    var layers = this._layerDefinitionModel.collection.reject(function (l) {
      return l.get('letter') === letter;
    });

    return _.chain(layers)
    .map(function (l) { return l.get('source'); })
    .compact()
    .sort()
    .value();
  }
});