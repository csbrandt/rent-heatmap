function(doc) {
	if (doc.properties.year) {
	   emit([doc.properties.year, doc.properties.region], doc.properties.average);
	}
}
