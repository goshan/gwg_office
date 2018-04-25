function init_template(){
  _.templateSettings = {
      interpolate: /\{\{(.+?)\}\}/g
  };
}

function template_to_html(id, data){
  template = _.template($('#'+id).html());
  return template(data);
}
