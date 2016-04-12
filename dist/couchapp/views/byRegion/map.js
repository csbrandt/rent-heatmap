function(doc) {
	if (doc.properties.region) {
	   emit(doc.properties.region, doc);
	}
}
