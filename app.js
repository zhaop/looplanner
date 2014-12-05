var OFFLINE = false;

var m = m;
var Q = Q;
var Combinatorics = Combinatorics;

Date.prototype.getWeek = function() {
  var onejan = new Date(this.getFullYear(), 0, 1);
  return Math.ceil((((this - onejan) / 86400000) + onejan.getDay() + 1) / 7);
}

// We're using UW's Open Data API
var api = {};
api.key = "f7e37298442b40975c6033c3dad07acc";
api.urlBase = "https://api.uwaterloo.ca/v2/";
api.url = {
  schedule: function(subject, catalog_number) {
    return api.urlBase + "courses/" + subject + "/" + catalog_number + "/schedule.json?key=" + api.key;
  },
};

// Thin ajax wrapper to fit mithril.js with Q.js callbacks
// Usage:
// ajax.get(url[, data])
var ajax = {
  get: function(url, data) {
    if (!data) data = {};
    var deferred = Q.defer();

    // Short-circuit ajax request, comment when going live
    if (OFFLINE) {
      deferred.resolve('');
      return deferred.promise;
    }

    m.request({
      method: "GET",
      url: url,
      data: data
    }).then(function(value) {
      deferred.resolve(value);
    }, function(err) {
      deferred.reject(err);
    });
    return deferred.promise;
  },
};

// Useful filter functions
var filters = {};

// Remove duplicate items
filters.unique = function(value, index, self) {
  return self.indexOf(value) === index;
};

// Remove empty items
filters.squish = function(value) {
  return value;
};

var app = {};

app.state = {
  READY: "ready",
  DOWNLOADING: "downloading",
  PROCESSING: "processing",
};

app.controller = function() {
  this.preferred_input = m.prop("");
  this.count = m.prop('');
  this.term = m.prop(1151);

  this.introscreen = m.prop(true);
  this.state = m.prop(app.state.READY);
  this.hover_course = m.prop('');

  this.schedules = m.prop({});
  this.course_data = m.prop({});

  this.conflicting_pairs = m.prop([]);
  this.section_selections = m.prop([]);
  this.active_selection = m.prop("");
  this.preferred = m.prop([]);

  this.viewer = new scheduleViewer.controller();
  this.viewer.hover_course = this.hover_course;

  this.debug = m.prop("");

  this.trace = function(msg) {
    this.debug(msg + '\n' + this.debug());
    m.redraw();
  };

  this.go_example = function () {
    this.preferred_input("ME269 ECE484 MTE420 ECE254 ME360 MSCI331 MSCI432 MTE241 NE336 NE353 NE445 SYDE252");
    this.count(5);
    this.term(1149);
    this.go(this.preferred_input, this.count);
  };
  
  this.go = function(preferred_input, count, e) {
    
    var self = this;

    // Turn text into array of unique course codes
    var preferred = preferred_input().toUpperCase().split(' ').filter(filters.squish).filter(filters.unique).sort();
    count = count();
    console.log("Preferred course array", preferred);
    console.log("Number of courses", count);

    // Sanity checks
    if (!count || count < 2 || count > 6) {
      this.trace("Nope: You must have between 2 and 6 courses");
      alert("Nope: You must have between 2 and 6 courses.");
      return;
    }
    if (preferred.length < count) {
      this.trace("Nope: Type in more courses you want to take");
      alert("Nope: Give me " + (count - preferred.length) + " more course you interest.");
      return;
    }

    this.preferred(preferred);
    
    this.state(app.state.DOWNLOADING);
    this.trace("Downloading course schedules...");

    // Get course schedules
    var schedules = {}, course_schedule, course_data = {};
    Q.all(preferred.map(function(course_code) {
      return ajax.get(api.url.schedule(
        course_code.replace(/[0-9]+/, ''),
        course_code.replace(/[A-Z]+/, '')
      ), {
        term: self.term()
      });
    })).then(function(courses) {
      
      // Short-circuit ajax data
      if (OFFLINE) {
        courses = [{"meta":{"requests":1382,"timestamp":1410101602,"status":200,"message":"Request successful","method_id":1171,"method":{"disclaimer":"Review the 'No Warranty' section of the University of Waterloo Open Data License before using this data. If building services upon this data, please inform your users of the inherent risks (as a best practice)","license":"https://uwaterloo.ca/open-data/university-waterloo-open-data-license-agreement-v1"}},"data":[{"subject":"ECE","catalog_number":"254","units":0.5,"title":"Operating Systems and Systems Programming","note":"Choose LAB section for Related 2.","class_number":5053,"section":"LEC 001","campus":"UW U","associated_class":1,"related_component_1":"101","related_component_2":null,"enrollment_capacity":108,"enrollment_total":100,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[{"reserve_group":"COMPE or ELE students ","enrollment_capacity":108,"enrollment_total":94}],"classes":[{"date":{"start_time":"13:30","end_time":"14:50","weekdays":"MF","start_date":null,"end_date":null,"is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"RCH","room":"211"},"instructors":["Moreno,Carlos"]},{"date":{"start_time":"12:30","end_time":"13:20","weekdays":"F","start_date":"09/19","end_date":"09/19","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"RCH","room":"211"},"instructors":["Moreno,Carlos"]},{"date":{"start_time":"12:30","end_time":"13:20","weekdays":"F","start_date":"10/03","end_date":"10/03","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"RCH","room":"211"},"instructors":["Moreno,Carlos"]},{"date":{"start_time":"12:30","end_time":"13:20","weekdays":"F","start_date":"10/17","end_date":"10/17","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"RCH","room":"211"},"instructors":["Moreno,Carlos"]},{"date":{"start_time":"12:30","end_time":"13:20","weekdays":"F","start_date":"10/31","end_date":"10/31","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"RCH","room":"211"},"instructors":["Moreno,Carlos"]},{"date":{"start_time":"12:30","end_time":"13:20","weekdays":"F","start_date":"11/14","end_date":"11/14","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"RCH","room":"211"},"instructors":["Moreno,Carlos"]},{"date":{"start_time":"12:30","end_time":"13:20","weekdays":"F","start_date":"11/28","end_date":"11/28","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"RCH","room":"211"},"instructors":["Moreno,Carlos"]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:07:10-04:00"},{"subject":"ECE","catalog_number":"254","units":0.5,"title":"Operating Systems and Systems Programming","note":"Choose LAB section for Related 2.","class_number":5054,"section":"TUT 101","campus":"UW U","associated_class":1,"related_component_1":null,"related_component_2":null,"enrollment_capacity":108,"enrollment_total":100,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"16:30","end_time":"17:20","weekdays":"Th","start_date":null,"end_date":null,"is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"RCH","room":"211"},"instructors":[]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:07:10-04:00"},{"subject":"ECE","catalog_number":"254","units":0.5,"title":"Operating Systems and Systems Programming","note":"Choose LAB section for Related 2.","class_number":5055,"section":"LAB 201","campus":"UW U","associated_class":1,"related_component_1":null,"related_component_2":null,"enrollment_capacity":18,"enrollment_total":17,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"08:30","end_time":"11:20","weekdays":"T","start_date":"09/09","end_date":"09/09","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2363"},"instructors":[]},{"date":{"start_time":"08:30","end_time":"11:20","weekdays":"T","start_date":"09/23","end_date":"09/23","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2363"},"instructors":[]},{"date":{"start_time":"08:30","end_time":"11:20","weekdays":"T","start_date":"10/07","end_date":"10/07","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2363"},"instructors":[]},{"date":{"start_time":"08:30","end_time":"11:20","weekdays":"T","start_date":"10/21","end_date":"10/21","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2363"},"instructors":[]},{"date":{"start_time":"08:30","end_time":"11:20","weekdays":"T","start_date":"11/04","end_date":"11/04","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2363"},"instructors":[]},{"date":{"start_time":"08:30","end_time":"11:20","weekdays":"T","start_date":"11/18","end_date":"11/18","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2363"},"instructors":[]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:07:10-04:00"},{"subject":"ECE","catalog_number":"254","units":0.5,"title":"Operating Systems and Systems Programming","note":"Choose LAB section for Related 2.","class_number":5056,"section":"LAB 202","campus":"UW U","associated_class":1,"related_component_1":null,"related_component_2":null,"enrollment_capacity":18,"enrollment_total":15,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"08:30","end_time":"11:20","weekdays":"W","start_date":"09/10","end_date":"09/10","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2363"},"instructors":[]},{"date":{"start_time":"08:30","end_time":"11:20","weekdays":"W","start_date":"09/24","end_date":"09/24","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2363"},"instructors":[]},{"date":{"start_time":"08:30","end_time":"11:20","weekdays":"W","start_date":"10/08","end_date":"10/08","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2363"},"instructors":[]},{"date":{"start_time":"08:30","end_time":"11:20","weekdays":"W","start_date":"10/22","end_date":"10/22","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2363"},"instructors":[]},{"date":{"start_time":"08:30","end_time":"11:20","weekdays":"W","start_date":"11/05","end_date":"11/05","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2363"},"instructors":[]},{"date":{"start_time":"08:30","end_time":"11:20","weekdays":"W","start_date":"11/19","end_date":"11/19","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2363"},"instructors":[]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:07:10-04:00"},{"subject":"ECE","catalog_number":"254","units":0.5,"title":"Operating Systems and Systems Programming","note":"Choose LAB section for Related 2.","class_number":5057,"section":"LAB 203","campus":"UW U","associated_class":1,"related_component_1":null,"related_component_2":null,"enrollment_capacity":18,"enrollment_total":16,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"08:30","end_time":"11:20","weekdays":"Th","start_date":"09/11","end_date":"09/11","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2363"},"instructors":[]},{"date":{"start_time":"08:30","end_time":"11:20","weekdays":"Th","start_date":"09/25","end_date":"09/25","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2363"},"instructors":[]},{"date":{"start_time":"08:30","end_time":"11:20","weekdays":"Th","start_date":"10/09","end_date":"10/09","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2363"},"instructors":[]},{"date":{"start_time":"08:30","end_time":"11:20","weekdays":"Th","start_date":"10/23","end_date":"10/23","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2363"},"instructors":[]},{"date":{"start_time":"08:30","end_time":"11:20","weekdays":"Th","start_date":"11/06","end_date":"11/06","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2363"},"instructors":[]},{"date":{"start_time":"08:30","end_time":"11:20","weekdays":"Th","start_date":"11/20","end_date":"11/20","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2363"},"instructors":[]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:07:10-04:00"},{"subject":"ECE","catalog_number":"254","units":0.5,"title":"Operating Systems and Systems Programming","note":"Choose LAB section for Related 2.","class_number":5058,"section":"LAB 204","campus":"UW U","associated_class":1,"related_component_1":null,"related_component_2":null,"enrollment_capacity":18,"enrollment_total":19,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"T","start_date":"09/09","end_date":"09/09","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2363"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"T","start_date":"09/23","end_date":"09/23","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2363"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"T","start_date":"10/07","end_date":"10/07","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2363"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"T","start_date":"10/21","end_date":"10/21","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2363"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"T","start_date":"11/04","end_date":"11/04","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2363"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"T","start_date":"11/18","end_date":"11/18","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2363"},"instructors":[]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:07:10-04:00"},{"subject":"ECE","catalog_number":"254","units":0.5,"title":"Operating Systems and Systems Programming","note":"Choose LAB section for Related 2.","class_number":5059,"section":"LAB 205","campus":"UW U","associated_class":1,"related_component_1":null,"related_component_2":null,"enrollment_capacity":18,"enrollment_total":18,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"W","start_date":"09/10","end_date":"09/10","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2363"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"W","start_date":"09/24","end_date":"09/24","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2363"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"W","start_date":"10/08","end_date":"10/08","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2363"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"W","start_date":"10/22","end_date":"10/22","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2363"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"W","start_date":"11/05","end_date":"11/05","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2363"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"W","start_date":"11/19","end_date":"11/19","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2363"},"instructors":[]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:07:10-04:00"},{"subject":"ECE","catalog_number":"254","units":0.5,"title":"Operating Systems and Systems Programming","note":"Choose LAB section for Related 2.","class_number":5060,"section":"LAB 206","campus":"UW U","associated_class":1,"related_component_1":null,"related_component_2":null,"enrollment_capacity":18,"enrollment_total":15,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"Th","start_date":"09/11","end_date":"09/11","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2363"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"Th","start_date":"09/25","end_date":"09/25","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2363"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"Th","start_date":"10/09","end_date":"10/09","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2363"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"Th","start_date":"10/23","end_date":"10/23","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2363"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"Th","start_date":"11/06","end_date":"11/06","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2363"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"Th","start_date":"11/20","end_date":"11/20","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2363"},"instructors":[]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:07:10-04:00"}]},{"meta":{"requests":1382,"timestamp":1410101602,"status":200,"message":"Request successful","method_id":1171,"method":{"disclaimer":"Review the 'No Warranty' section of the University of Waterloo Open Data License before using this data. If building services upon this data, please inform your users of the inherent risks (as a best practice)","license":"https://uwaterloo.ca/open-data/university-waterloo-open-data-license-agreement-v1"}},"data":[{"subject":"ECE","catalog_number":"484","units":0.5,"title":"Digital Control Applications","note":null,"class_number":4809,"section":"LEC 001","campus":"UW U","associated_class":1,"related_component_1":"101","related_component_2":"201","enrollment_capacity":128,"enrollment_total":117,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[{"reserve_group":"4A Mechatronics Students ","enrollment_capacity":128,"enrollment_total":113}],"classes":[{"date":{"start_time":"12:30","end_time":"13:20","weekdays":"MWF","start_date":null,"end_date":null,"is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"DWE","room":"2402"},"instructors":["Miller,Daniel E"]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:07:11-04:00"},{"subject":"ECE","catalog_number":"484","units":0.5,"title":"Digital Control Applications","note":null,"class_number":4810,"section":"TUT 101","campus":"UW U","associated_class":1,"related_component_1":null,"related_component_2":null,"enrollment_capacity":128,"enrollment_total":117,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"08:30","end_time":"09:20","weekdays":"F","start_date":null,"end_date":null,"is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"RCH","room":"301"},"instructors":[]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:07:11-04:00"},{"subject":"ECE","catalog_number":"484","units":0.5,"title":"Digital Control Applications","note":null,"class_number":4811,"section":"LAB 201","campus":"UW U","associated_class":1,"related_component_1":null,"related_component_2":null,"enrollment_capacity":128,"enrollment_total":117,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":null,"end_time":null,"weekdays":null,"start_date":null,"end_date":null,"is_tba":true,"is_cancelled":false,"is_closed":false},"location":{"building":null,"room":null},"instructors":[]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:07:11-04:00"}]},{"meta":{"requests":1382,"timestamp":1410101602,"status":200,"message":"Request successful","method_id":1171,"method":{"disclaimer":"Review the 'No Warranty' section of the University of Waterloo Open Data License before using this data. If building services upon this data, please inform your users of the inherent risks (as a best practice)","license":"https://uwaterloo.ca/open-data/university-waterloo-open-data-license-agreement-v1"}},"data":[{"subject":"ME","catalog_number":"269","units":0.5,"title":"Electromechanical Devices and Power Processing","note":"Choose LAB section for Related 1 and TUT section for Related 2.","class_number":4443,"section":"LEC 001","campus":"UW U","associated_class":1,"related_component_1":null,"related_component_2":null,"enrollment_capacity":128,"enrollment_total":121,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"13:30","end_time":"14:20","weekdays":"TWTh","start_date":null,"end_date":null,"is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"DWE","room":"2402"},"instructors":["Mohamed,Samar"]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:08:29-04:00"},{"subject":"ME","catalog_number":"269","units":0.5,"title":"Electromechanical Devices and Power Processing","note":"Choose LAB section for Related 1 and TUT section for Related 2.","class_number":4444,"section":"LAB 101","campus":"UW U","associated_class":1,"related_component_1":null,"related_component_2":null,"enrollment_capacity":42,"enrollment_total":39,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"08:30","end_time":"11:20","weekdays":"T","start_date":"09/09","end_date":"09/09","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"CPH","room":"1333"},"instructors":[]},{"date":{"start_time":"08:30","end_time":"11:20","weekdays":"T","start_date":"09/23","end_date":"09/23","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"CPH","room":"1333"},"instructors":[]},{"date":{"start_time":"08:30","end_time":"11:20","weekdays":"T","start_date":"10/07","end_date":"10/07","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"CPH","room":"1333"},"instructors":[]},{"date":{"start_time":"08:30","end_time":"11:20","weekdays":"T","start_date":"11/04","end_date":"11/04","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"CPH","room":"1333"},"instructors":[]},{"date":{"start_time":"08:30","end_time":"11:20","weekdays":"T","start_date":"11/18","end_date":"11/18","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"CPH","room":"1333"},"instructors":[]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:08:29-04:00"},{"subject":"ME","catalog_number":"269","units":0.5,"title":"Electromechanical Devices and Power Processing","note":"Choose LAB section for Related 1 and TUT section for Related 2.","class_number":5092,"section":"LAB 102","campus":"UW U","associated_class":1,"related_component_1":null,"related_component_2":null,"enrollment_capacity":43,"enrollment_total":40,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"08:30","end_time":"11:20","weekdays":"W","start_date":"09/10","end_date":"09/10","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"CPH","room":"1333"},"instructors":[]},{"date":{"start_time":"08:30","end_time":"11:20","weekdays":"W","start_date":"09/24","end_date":"09/24","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"CPH","room":"1333"},"instructors":[]},{"date":{"start_time":"08:30","end_time":"11:20","weekdays":"W","start_date":"10/08","end_date":"10/08","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"CPH","room":"1333"},"instructors":[]},{"date":{"start_time":"08:30","end_time":"11:20","weekdays":"W","start_date":"11/05","end_date":"11/05","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"CPH","room":"1333"},"instructors":[]},{"date":{"start_time":"08:30","end_time":"11:20","weekdays":"W","start_date":"11/19","end_date":"11/19","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"CPH","room":"1333"},"instructors":[]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:08:29-04:00"},{"subject":"ME","catalog_number":"269","units":0.5,"title":"Electromechanical Devices and Power Processing","note":"Choose LAB section for Related 1 and TUT section for Related 2.","class_number":5093,"section":"LAB 103","campus":"UW U","associated_class":1,"related_component_1":null,"related_component_2":null,"enrollment_capacity":43,"enrollment_total":42,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"08:30","end_time":"11:20","weekdays":"Th","start_date":"09/11","end_date":"09/11","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"CPH","room":"1333"},"instructors":[]},{"date":{"start_time":"08:30","end_time":"11:20","weekdays":"Th","start_date":"09/25","end_date":"09/25","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"CPH","room":"1333"},"instructors":[]},{"date":{"start_time":"08:30","end_time":"11:20","weekdays":"Th","start_date":"10/09","end_date":"10/09","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"CPH","room":"1333"},"instructors":[]},{"date":{"start_time":"08:30","end_time":"11:20","weekdays":"Th","start_date":"11/06","end_date":"11/06","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"CPH","room":"1333"},"instructors":[]},{"date":{"start_time":"08:30","end_time":"11:20","weekdays":"Th","start_date":"11/20","end_date":"11/20","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"CPH","room":"1333"},"instructors":[]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:08:29-04:00"},{"subject":"ME","catalog_number":"269","units":0.5,"title":"Electromechanical Devices and Power Processing","note":"Choose LAB section for Related 1 and TUT section for Related 2.","class_number":4445,"section":"TUT 201","campus":"UW U","associated_class":1,"related_component_1":null,"related_component_2":null,"enrollment_capacity":64,"enrollment_total":59,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"08:30","end_time":"10:20","weekdays":"T","start_date":null,"end_date":null,"is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"DWE","room":"3516"},"instructors":[]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:08:29-04:00"},{"subject":"ME","catalog_number":"269","units":0.5,"title":"Electromechanical Devices and Power Processing","note":"Choose LAB section for Related 1 and TUT section for Related 2.","class_number":4446,"section":"TUT 202","campus":"UW U","associated_class":1,"related_component_1":null,"related_component_2":null,"enrollment_capacity":64,"enrollment_total":62,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"08:30","end_time":"10:20","weekdays":"W","start_date":null,"end_date":null,"is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E5","room":"3102"},"instructors":[]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:08:29-04:00"}]},{"meta":{"requests":1380,"timestamp":1410101601,"status":200,"message":"Request successful","method_id":1171,"method":{"disclaimer":"Review the 'No Warranty' section of the University of Waterloo Open Data License before using this data. If building services upon this data, please inform your users of the inherent risks (as a best practice)","license":"https://uwaterloo.ca/open-data/university-waterloo-open-data-license-agreement-v1"}},"data":[{"subject":"ME","catalog_number":"360","units":0.5,"title":"Introduction to Control Systems","note":"Choose TUT section for Related 2.","class_number":4455,"section":"LEC 001","campus":"UW U","associated_class":1,"related_component_1":"101","related_component_2":null,"enrollment_capacity":118,"enrollment_total":121,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"09:30","end_time":"11:20","weekdays":"Th","start_date":null,"end_date":null,"is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E5","room":"3102"},"instructors":["Jeon,Soo"]},{"date":{"start_time":"10:30","end_time":"11:20","weekdays":"F","start_date":null,"end_date":null,"is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E5","room":"3102"},"instructors":["Jeon,Soo"]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:08:29-04:00"},{"subject":"ME","catalog_number":"360","units":0.5,"title":"Introduction to Control Systems","note":"Choose TUT section for Related 2.","class_number":4456,"section":"LAB 101","campus":"UW U","associated_class":1,"related_component_1":null,"related_component_2":null,"enrollment_capacity":118,"enrollment_total":121,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":null,"end_time":null,"weekdays":null,"start_date":null,"end_date":null,"is_tba":true,"is_cancelled":false,"is_closed":false},"location":{"building":null,"room":null},"instructors":[]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:08:29-04:00"},{"subject":"ME","catalog_number":"360","units":0.5,"title":"Introduction to Control Systems","note":"Choose TUT section for Related 2.","class_number":4457,"section":"TUT 201","campus":"UW U","associated_class":1,"related_component_1":null,"related_component_2":null,"enrollment_capacity":59,"enrollment_total":62,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"12:30","end_time":"13:20","weekdays":"W","start_date":null,"end_date":null,"is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E5","room":"3101"},"instructors":[]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:08:29-04:00"},{"subject":"ME","catalog_number":"360","units":0.5,"title":"Introduction to Control Systems","note":"Choose TUT section for Related 2.","class_number":4458,"section":"TUT 202","campus":"UW U","associated_class":1,"related_component_1":null,"related_component_2":null,"enrollment_capacity":59,"enrollment_total":59,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"13:30","end_time":"14:20","weekdays":"W","start_date":null,"end_date":null,"is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E5","room":"3101"},"instructors":[]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:08:29-04:00"}]},{"meta":{"requests":1382,"timestamp":1410101602,"status":200,"message":"Request successful","method_id":1171,"method":{"disclaimer":"Review the 'No Warranty' section of the University of Waterloo Open Data License before using this data. If building services upon this data, please inform your users of the inherent risks (as a best practice)","license":"https://uwaterloo.ca/open-data/university-waterloo-open-data-license-agreement-v1"}},"data":[{"subject":"MSCI","catalog_number":"331","units":0.5,"title":"Introduction to Optimization","note":null,"class_number":4627,"section":"LEC 001","campus":"UW U","associated_class":1,"related_component_1":"101","related_component_2":null,"enrollment_capacity":58,"enrollment_total":35,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"16:30","end_time":"17:20","weekdays":"W","start_date":null,"end_date":null,"is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"1303A"},"instructors":["Cai,Qishu"]},{"date":{"start_time":"16:30","end_time":"18:20","weekdays":"M","start_date":null,"end_date":null,"is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"RCH","room":"308"},"instructors":["Cai,Qishu"]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:08:32-04:00"},{"subject":"MSCI","catalog_number":"331","units":0.5,"title":"Introduction to Optimization","note":null,"class_number":4628,"section":"TUT 101","campus":"UW U","associated_class":1,"related_component_1":null,"related_component_2":null,"enrollment_capacity":58,"enrollment_total":35,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"11:30","end_time":"12:20","weekdays":"Th","start_date":null,"end_date":null,"is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"RCH","room":"305"},"instructors":["Xu,Shuo"]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:08:32-04:00"}]},{"meta":{"requests":1381,"timestamp":1410101602,"status":200,"message":"Request successful","method_id":1171,"method":{"disclaimer":"Review the 'No Warranty' section of the University of Waterloo Open Data License before using this data. If building services upon this data, please inform your users of the inherent risks (as a best practice)","license":"https://uwaterloo.ca/open-data/university-waterloo-open-data-license-agreement-v1"}},"data":[{"subject":"MSCI","catalog_number":"432","units":0.5,"title":"Production and Service Operations Management","note":null,"class_number":4629,"section":"LEC 001","campus":"UW U","associated_class":1,"related_component_1":"101","related_component_2":null,"enrollment_capacity":90,"enrollment_total":28,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"14:30","end_time":"16:20","weekdays":"F","start_date":null,"end_date":null,"is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"1303A"},"instructors":["Bayley,Tiffany Amber"]},{"date":{"start_time":"15:30","end_time":"16:20","weekdays":"T","start_date":null,"end_date":null,"is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"RCH","room":"211"},"instructors":["Bayley,Tiffany Amber"]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:08:33-04:00"},{"subject":"MSCI","catalog_number":"432","units":0.5,"title":"Production and Service Operations Management","note":null,"class_number":4630,"section":"TUT 101","campus":"UW U","associated_class":1,"related_component_1":null,"related_component_2":null,"enrollment_capacity":90,"enrollment_total":28,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"08:30","end_time":"09:20","weekdays":"Th","start_date":null,"end_date":null,"is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"1303A"},"instructors":["Nemutlu,Gizem Sultan"]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:08:33-04:00"}]},{"meta":{"requests":1388,"timestamp":1410101603,"status":200,"message":"Request successful","method_id":1171,"method":{"disclaimer":"Review the 'No Warranty' section of the University of Waterloo Open Data License before using this data. If building services upon this data, please inform your users of the inherent risks (as a best practice)","license":"https://uwaterloo.ca/open-data/university-waterloo-open-data-license-agreement-v1"}},"data":[{"subject":"MTE","catalog_number":"241","units":0.5,"title":"Introduction to Computer Structures & Real-Time Systems","note":"Choose TUT section for Related 1 and LAB section for Related 2.","class_number":4729,"section":"LEC 001","campus":"UW U","associated_class":1,"related_component_1":null,"related_component_2":null,"enrollment_capacity":128,"enrollment_total":121,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"10:30","end_time":"11:20","weekdays":"M","start_date":null,"end_date":null,"is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"DWE","room":"2402"},"instructors":["Harder,Douglas"]},{"date":{"start_time":"08:30","end_time":"09:20","weekdays":"T","start_date":null,"end_date":null,"is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"DWE","room":"2402"},"instructors":["Harder,Douglas"]},{"date":{"start_time":"09:30","end_time":"10:20","weekdays":"Th","start_date":null,"end_date":null,"is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"DWE","room":"2402"},"instructors":["Harder,Douglas"]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:08:35-04:00"},{"subject":"MTE","catalog_number":"241","units":0.5,"title":"Introduction to Computer Structures & Real-Time Systems","note":"Choose TUT section for Related 1 and LAB section for Related 2.","class_number":4730,"section":"TUT 101","campus":"UW U","associated_class":1,"related_component_1":null,"related_component_2":null,"enrollment_capacity":64,"enrollment_total":57,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"13:30","end_time":"14:20","weekdays":"Th","start_date":null,"end_date":null,"is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"MC","room":"4058"},"instructors":[]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:08:35-04:00"},{"subject":"MTE","catalog_number":"241","units":0.5,"title":"Introduction to Computer Structures & Real-Time Systems","note":"Choose TUT section for Related 1 and LAB section for Related 2.","class_number":4731,"section":"TUT 102","campus":"UW U","associated_class":1,"related_component_1":null,"related_component_2":null,"enrollment_capacity":64,"enrollment_total":64,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"14:30","end_time":"15:20","weekdays":"Th","start_date":null,"end_date":null,"is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E5","room":"3102"},"instructors":[]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:08:35-04:00"},{"subject":"MTE","catalog_number":"241","units":0.5,"title":"Introduction to Computer Structures & Real-Time Systems","note":"Choose TUT section for Related 1 and LAB section for Related 2.","class_number":4732,"section":"LAB 201","campus":"UW U","associated_class":1,"related_component_1":null,"related_component_2":null,"enrollment_capacity":42,"enrollment_total":43,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"W","start_date":"09/17","end_date":"09/17","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2356"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"W","start_date":"10/01","end_date":"10/01","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2356"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"W","start_date":"10/15","end_date":"10/15","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2356"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"W","start_date":"10/29","end_date":"10/29","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2356"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"W","start_date":"11/12","end_date":"11/12","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2356"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"W","start_date":"11/26","end_date":"11/26","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2356"},"instructors":[]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:08:35-04:00"},{"subject":"MTE","catalog_number":"241","units":0.5,"title":"Introduction to Computer Structures & Real-Time Systems","note":"Choose TUT section for Related 1 and LAB section for Related 2.","class_number":5119,"section":"LAB 202","campus":"UW U","associated_class":1,"related_component_1":null,"related_component_2":null,"enrollment_capacity":43,"enrollment_total":35,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"F","start_date":"09/19","end_date":"09/19","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2356"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"F","start_date":"10/03","end_date":"10/03","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2356"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"F","start_date":"10/17","end_date":"10/17","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2356"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"F","start_date":"10/31","end_date":"10/31","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2356"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"F","start_date":"11/14","end_date":"11/14","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2356"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"F","start_date":"11/28","end_date":"11/28","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2356"},"instructors":[]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:08:35-04:00"},{"subject":"MTE","catalog_number":"241","units":0.5,"title":"Introduction to Computer Structures & Real-Time Systems","note":"Choose TUT section for Related 1 and LAB section for Related 2.","class_number":5120,"section":"LAB 203","campus":"UW U","associated_class":1,"related_component_1":null,"related_component_2":null,"enrollment_capacity":43,"enrollment_total":43,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"M","start_date":"09/15","end_date":"09/15","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2356"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"M","start_date":"09/29","end_date":"09/29","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2356"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"M","start_date":"10/13","end_date":"10/13","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2356"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"M","start_date":"10/27","end_date":"10/27","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2356"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"M","start_date":"11/10","end_date":"11/10","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2356"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"M","start_date":"11/24","end_date":"11/24","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E2","room":"2356"},"instructors":[]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:08:35-04:00"}]},{"meta":{"requests":1387,"timestamp":1410101602,"status":200,"message":"Request successful","method_id":1171,"method":{"disclaimer":"Review the 'No Warranty' section of the University of Waterloo Open Data License before using this data. If building services upon this data, please inform your users of the inherent risks (as a best practice)","license":"https://uwaterloo.ca/open-data/university-waterloo-open-data-license-agreement-v1"}},"data":[{"subject":"MTE","catalog_number":"420","units":0.5,"title":"Power Electronics and Motor Drives","note":"Choose LAB section for Related 2.","class_number":5121,"section":"LEC 001","campus":"UW U","associated_class":1,"related_component_1":"101","related_component_2":null,"enrollment_capacity":60,"enrollment_total":52,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"15:30","end_time":"18:20","weekdays":"Th","start_date":null,"end_date":null,"is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E5","room":"3102"},"instructors":["Kazerani,Mehrdad"]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:08:35-04:00"},{"subject":"MTE","catalog_number":"420","units":0.5,"title":"Power Electronics and Motor Drives","note":"Choose LAB section for Related 2.","class_number":5122,"section":"TUT 101","campus":"UW U","associated_class":1,"related_component_1":null,"related_component_2":null,"enrollment_capacity":60,"enrollment_total":52,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"17:30","end_time":"18:20","weekdays":"M","start_date":null,"end_date":null,"is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"CPH","room":"3679"},"instructors":[]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:08:35-04:00"},{"subject":"MTE","catalog_number":"420","units":0.5,"title":"Power Electronics and Motor Drives","note":"Choose LAB section for Related 2.","class_number":5123,"section":"LAB 201","campus":"UW U","associated_class":1,"related_component_1":null,"related_component_2":null,"enrollment_capacity":20,"enrollment_total":20,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"F","start_date":"09/12","end_date":"09/12","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"CPH","room":"1333"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"F","start_date":"09/26","end_date":"09/26","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"CPH","room":"1333"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"F","start_date":"10/10","end_date":"10/10","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"CPH","room":"1333"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"F","start_date":"10/24","end_date":"10/24","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"CPH","room":"1333"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"F","start_date":"11/07","end_date":"11/07","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"CPH","room":"1333"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"F","start_date":"11/21","end_date":"11/21","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"CPH","room":"1333"},"instructors":[]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:08:35-04:00"},{"subject":"MTE","catalog_number":"420","units":0.5,"title":"Power Electronics and Motor Drives","note":"Choose LAB section for Related 2.","class_number":5124,"section":"LAB 202","campus":"UW U","associated_class":1,"related_component_1":null,"related_component_2":null,"enrollment_capacity":20,"enrollment_total":20,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"F","start_date":"09/19","end_date":"09/19","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"CPH","room":"1333"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"F","start_date":"10/03","end_date":"10/03","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"CPH","room":"1333"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"F","start_date":"10/17","end_date":"10/17","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"CPH","room":"1333"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"F","start_date":"10/31","end_date":"10/31","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"CPH","room":"1333"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"F","start_date":"11/14","end_date":"11/14","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"CPH","room":"1333"},"instructors":[]},{"date":{"start_time":"13:30","end_time":"16:20","weekdays":"F","start_date":"11/28","end_date":"11/28","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"CPH","room":"1333"},"instructors":[]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:08:35-04:00"},{"subject":"MTE","catalog_number":"420","units":0.5,"title":"Power Electronics and Motor Drives","note":"Choose LAB section for Related 2.","class_number":8467,"section":"LAB 203","campus":"UW U","associated_class":99,"related_component_1":"99","related_component_2":null,"enrollment_capacity":20,"enrollment_total":12,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"09:30","end_time":"12:20","weekdays":"F","start_date":"09/12","end_date":"09/12","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"CPH","room":"1333"},"instructors":[]},{"date":{"start_time":"09:30","end_time":"12:20","weekdays":"F","start_date":"09/26","end_date":"09/26","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"CPH","room":"1333"},"instructors":[]},{"date":{"start_time":"09:30","end_time":"12:20","weekdays":"F","start_date":"10/10","end_date":"10/10","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"CPH","room":"1333"},"instructors":[]},{"date":{"start_time":"09:30","end_time":"12:20","weekdays":"F","start_date":"10/24","end_date":"10/24","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"CPH","room":"1333"},"instructors":[]},{"date":{"start_time":"09:30","end_time":"12:20","weekdays":"F","start_date":"11/07","end_date":"11/07","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"CPH","room":"1333"},"instructors":[]},{"date":{"start_time":"09:30","end_time":"12:20","weekdays":"F","start_date":"11/21","end_date":"11/21","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"CPH","room":"1333"},"instructors":[]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:08:35-04:00"}]},{"meta":{"requests":1386,"timestamp":1410101602,"status":200,"message":"Request successful","method_id":1171,"method":{"disclaimer":"Review the 'No Warranty' section of the University of Waterloo Open Data License before using this data. If building services upon this data, please inform your users of the inherent risks (as a best practice)","license":"https://uwaterloo.ca/open-data/university-waterloo-open-data-license-agreement-v1"}},"data":[{"subject":"NE","catalog_number":"336","units":0.5,"title":"Micro and Nanosystem Computer-aided Design","note":"Choose LAB section for Related 2.","class_number":4858,"section":"LEC 001","campus":"UW U","associated_class":1,"related_component_1":"101","related_component_2":null,"enrollment_capacity":100,"enrollment_total":87,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"11:30","end_time":"12:20","weekdays":"WF","start_date":null,"end_date":null,"is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"QNC","room":"1502"},"instructors":["Ricardez Sandoval,Luis Alberto"]},{"date":{"start_time":"09:30","end_time":"10:20","weekdays":"F","start_date":"09/12","end_date":"09/12","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"QNC","room":"2502"},"instructors":["Ricardez Sandoval,Luis Alberto"]},{"date":{"start_time":"11:30","end_time":"12:20","weekdays":"Th","start_date":null,"end_date":null,"is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"QNC","room":"2502"},"instructors":["Ricardez Sandoval,Luis Alberto"]},{"date":{"start_time":"09:30","end_time":"10:20","weekdays":"F","start_date":"09/26","end_date":"09/26","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"QNC","room":"2502"},"instructors":["Ricardez Sandoval,Luis Alberto"]},{"date":{"start_time":"09:30","end_time":"10:20","weekdays":"F","start_date":"10/10","end_date":"10/10","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"QNC","room":"2502"},"instructors":["Ricardez Sandoval,Luis Alberto"]},{"date":{"start_time":"09:30","end_time":"10:20","weekdays":"F","start_date":"10/24","end_date":"10/24","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"QNC","room":"2502"},"instructors":["Ricardez Sandoval,Luis Alberto"]},{"date":{"start_time":"09:30","end_time":"10:20","weekdays":"F","start_date":"11/07","end_date":"11/07","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"QNC","room":"2502"},"instructors":["Ricardez Sandoval,Luis Alberto"]},{"date":{"start_time":"09:30","end_time":"10:20","weekdays":"F","start_date":"11/21","end_date":"11/21","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"QNC","room":"2502"},"instructors":["Ricardez Sandoval,Luis Alberto"]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:08:42-04:00"},{"subject":"NE","catalog_number":"336","units":0.5,"title":"Micro and Nanosystem Computer-aided Design","note":"Choose LAB section for Related 2.","class_number":4859,"section":"TUT 101","campus":"UW U","associated_class":1,"related_component_1":null,"related_component_2":null,"enrollment_capacity":100,"enrollment_total":87,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"13:30","end_time":"14:20","weekdays":"T","start_date":null,"end_date":null,"is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"B1","room":"370"},"instructors":["Ricardez Sandoval,Luis Alberto"]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:08:42-04:00"},{"subject":"NE","catalog_number":"336","units":0.5,"title":"Micro and Nanosystem Computer-aided Design","note":"Choose LAB section for Related 2.","class_number":4860,"section":"LAB 201","campus":"UW U","associated_class":1,"related_component_1":null,"related_component_2":null,"enrollment_capacity":50,"enrollment_total":44,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"14:30","end_time":"17:20","weekdays":"T","start_date":"09/09","end_date":"09/09","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"B1","room":"370"},"instructors":["Ricardez Sandoval,Luis Alberto"]},{"date":{"start_time":"14:30","end_time":"17:20","weekdays":"T","start_date":"09/23","end_date":"09/23","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"B1","room":"370"},"instructors":["Ricardez Sandoval,Luis Alberto"]},{"date":{"start_time":"14:30","end_time":"17:20","weekdays":"T","start_date":"10/07","end_date":"10/07","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"B1","room":"370"},"instructors":["Ricardez Sandoval,Luis Alberto"]},{"date":{"start_time":"14:30","end_time":"17:20","weekdays":"T","start_date":"10/21","end_date":"10/21","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"B1","room":"370"},"instructors":["Ricardez Sandoval,Luis Alberto"]},{"date":{"start_time":"14:30","end_time":"17:20","weekdays":"T","start_date":"11/04","end_date":"11/04","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"B1","room":"370"},"instructors":["Ricardez Sandoval,Luis Alberto"]},{"date":{"start_time":"14:30","end_time":"17:20","weekdays":"T","start_date":"11/18","end_date":"11/18","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"B1","room":"370"},"instructors":["Ricardez Sandoval,Luis Alberto"]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:08:42-04:00"},{"subject":"NE","catalog_number":"336","units":0.5,"title":"Micro and Nanosystem Computer-aided Design","note":"Choose LAB section for Related 2.","class_number":4861,"section":"LAB 202","campus":"UW U","associated_class":1,"related_component_1":null,"related_component_2":null,"enrollment_capacity":50,"enrollment_total":43,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"14:30","end_time":"17:20","weekdays":"T","start_date":"09/16","end_date":"09/16","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"B1","room":"370"},"instructors":["Ricardez Sandoval,Luis Alberto"]},{"date":{"start_time":"14:30","end_time":"17:20","weekdays":"T","start_date":"09/30","end_date":"09/30","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"B1","room":"370"},"instructors":["Ricardez Sandoval,Luis Alberto"]},{"date":{"start_time":"14:30","end_time":"17:20","weekdays":"T","start_date":"10/14","end_date":"10/14","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"B1","room":"370"},"instructors":["Ricardez Sandoval,Luis Alberto"]},{"date":{"start_time":"14:30","end_time":"17:20","weekdays":"T","start_date":"10/28","end_date":"10/28","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"B1","room":"370"},"instructors":["Ricardez Sandoval,Luis Alberto"]},{"date":{"start_time":"14:30","end_time":"17:20","weekdays":"T","start_date":"11/11","end_date":"11/11","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"B1","room":"370"},"instructors":["Ricardez Sandoval,Luis Alberto"]},{"date":{"start_time":"14:30","end_time":"17:20","weekdays":"T","start_date":"11/25","end_date":"11/25","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"B1","room":"370"},"instructors":["Ricardez Sandoval,Luis Alberto"]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:08:42-04:00"}]},{"meta":{"requests":1389,"timestamp":1410101603,"status":200,"message":"Request successful","method_id":1171,"method":{"disclaimer":"Review the 'No Warranty' section of the University of Waterloo Open Data License before using this data. If building services upon this data, please inform your users of the inherent risks (as a best practice)","license":"https://uwaterloo.ca/open-data/university-waterloo-open-data-license-agreement-v1"}},"data":[{"subject":"NE","catalog_number":"353","units":0.5,"title":"Nanoprobing and Lithography","note":null,"class_number":4864,"section":"LEC 001","campus":"UW U","associated_class":1,"related_component_1":"101","related_component_2":null,"enrollment_capacity":100,"enrollment_total":86,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"10:30","end_time":"11:20","weekdays":"TWTh","start_date":null,"end_date":null,"is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"QNC","room":"2502"},"instructors":["Cui,Bo"]},{"date":{"start_time":"09:30","end_time":"10:20","weekdays":"F","start_date":"09/19","end_date":"09/19","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"QNC","room":"2502"},"instructors":["Cui,Bo"]},{"date":{"start_time":"09:30","end_time":"10:20","weekdays":"F","start_date":"10/03","end_date":"10/03","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"QNC","room":"2502"},"instructors":["Cui,Bo"]},{"date":{"start_time":"09:30","end_time":"10:20","weekdays":"F","start_date":"10/17","end_date":"10/17","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"QNC","room":"2502"},"instructors":["Cui,Bo"]},{"date":{"start_time":"09:30","end_time":"10:20","weekdays":"F","start_date":"10/31","end_date":"10/31","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"QNC","room":"2502"},"instructors":["Cui,Bo"]},{"date":{"start_time":"09:30","end_time":"10:20","weekdays":"F","start_date":"11/14","end_date":"11/14","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"QNC","room":"2502"},"instructors":["Cui,Bo"]},{"date":{"start_time":"09:30","end_time":"10:20","weekdays":"F","start_date":"11/28","end_date":"11/28","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"QNC","room":"2502"},"instructors":["Cui,Bo"]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:08:43-04:00"},{"subject":"NE","catalog_number":"353","units":0.5,"title":"Nanoprobing and Lithography","note":null,"class_number":4865,"section":"TUT 101","campus":"UW U","associated_class":1,"related_component_1":null,"related_component_2":null,"enrollment_capacity":100,"enrollment_total":86,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"10:30","end_time":"11:20","weekdays":"F","start_date":null,"end_date":null,"is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"QNC","room":"2502"},"instructors":["Cui,Bo"]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:08:43-04:00"}]},{"meta":{"requests":1390,"timestamp":1410101603,"status":200,"message":"Request successful","method_id":1171,"method":{"disclaimer":"Review the 'No Warranty' section of the University of Waterloo Open Data License before using this data. If building services upon this data, please inform your users of the inherent risks (as a best practice)","license":"https://uwaterloo.ca/open-data/university-waterloo-open-data-license-agreement-v1"}},"data":[{"subject":"NE","catalog_number":"445","units":0.5,"title":"Photonic Materials and Devices","note":null,"class_number":4927,"section":"LEC 001","campus":"UW U","associated_class":1,"related_component_1":null,"related_component_2":null,"enrollment_capacity":70,"enrollment_total":68,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"11:30","end_time":"12:50","weekdays":"MF","start_date":null,"end_date":null,"is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"QNC","room":"2502"},"instructors":["Ban,Dayan"]},{"date":{"start_time":"17:30","end_time":"18:20","weekdays":"M","start_date":"09/08","end_date":"09/08","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"QNC","room":"2502"},"instructors":["Ban,Dayan"]},{"date":{"start_time":"17:30","end_time":"18:20","weekdays":"M","start_date":"09/22","end_date":"09/22","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"QNC","room":"2502"},"instructors":["Ban,Dayan"]},{"date":{"start_time":"17:30","end_time":"18:20","weekdays":"M","start_date":"10/06","end_date":"10/06","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"QNC","room":"2502"},"instructors":["Ban,Dayan"]},{"date":{"start_time":"17:30","end_time":"18:20","weekdays":"M","start_date":"10/27","end_date":"10/27","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"QNC","room":"2502"},"instructors":["Ban,Dayan"]},{"date":{"start_time":"17:30","end_time":"18:20","weekdays":"M","start_date":"11/10","end_date":"11/10","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"QNC","room":"2502"},"instructors":["Ban,Dayan"]},{"date":{"start_time":"17:30","end_time":"18:20","weekdays":"M","start_date":"11/24","end_date":"11/24","is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"QNC","room":"2502"},"instructors":["Ban,Dayan"]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:08:43-04:00"}]},{"meta":{"requests":1388,"timestamp":1410101603,"status":200,"message":"Request successful","method_id":1171,"method":{"disclaimer":"Review the 'No Warranty' section of the University of Waterloo Open Data License before using this data. If building services upon this data, please inform your users of the inherent risks (as a best practice)","license":"https://uwaterloo.ca/open-data/university-waterloo-open-data-license-agreement-v1"}},"data":[{"subject":"SYDE","catalog_number":"252","units":0.5,"title":"Linear Systems and Signals","note":"Section 002 - Choose TUT with same Associated Class number as primary meet. Section 001 is auto-enrolled.","class_number":4429,"section":"LEC 001","campus":"UW U","associated_class":1,"related_component_1":"101","related_component_2":null,"enrollment_capacity":104,"enrollment_total":87,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[{"reserve_group":"SYDE students ","enrollment_capacity":104,"enrollment_total":87}],"classes":[{"date":{"start_time":"10:00","end_time":"11:20","weekdays":"TTh","start_date":null,"end_date":null,"is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E5","room":"6006"},"instructors":["Lashgarian Azad,Nasser"]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:09:32-04:00"},{"subject":"SYDE","catalog_number":"252","units":0.5,"title":"Linear Systems and Signals","note":"Section 002 - Choose TUT with same Associated Class number as primary meet. Section 001 is auto-enrolled.","class_number":4695,"section":"LEC 002","campus":"UW U","associated_class":2,"related_component_1":null,"related_component_2":null,"enrollment_capacity":128,"enrollment_total":115,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[{"reserve_group":"2B Mechatronics students ","enrollment_capacity":128,"enrollment_total":115}],"classes":[{"date":{"start_time":"10:30","end_time":"11:20","weekdays":"TF","start_date":null,"end_date":null,"is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"DWE","room":"2402"},"instructors":["Zelek,John Stanislaw"]},{"date":{"start_time":"11:30","end_time":"12:20","weekdays":"W","start_date":null,"end_date":null,"is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"DWE","room":"2402"},"instructors":["Zelek,John Stanislaw"]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:09:32-04:00"},{"subject":"SYDE","catalog_number":"252","units":0.5,"title":"Linear Systems and Signals","note":"Section 002 - Choose TUT with same Associated Class number as primary meet. Section 001 is auto-enrolled.","class_number":4430,"section":"TUT 101","campus":"UW U","associated_class":1,"related_component_1":null,"related_component_2":null,"enrollment_capacity":104,"enrollment_total":87,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"12:30","end_time":"13:20","weekdays":"W","start_date":null,"end_date":null,"is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E5","room":"6006"},"instructors":["Lashgarian Azad,Nasser"]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:09:32-04:00"},{"subject":"SYDE","catalog_number":"252","units":0.5,"title":"Linear Systems and Signals","note":"Section 002 - Choose TUT with same Associated Class number as primary meet. Section 001 is auto-enrolled.","class_number":4694,"section":"TUT 102","campus":"UW U","associated_class":2,"related_component_1":null,"related_component_2":null,"enrollment_capacity":64,"enrollment_total":63,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"13:30","end_time":"14:20","weekdays":"Th","start_date":null,"end_date":null,"is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"MC","room":"4042"},"instructors":[]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:09:32-04:00"},{"subject":"SYDE","catalog_number":"252","units":0.5,"title":"Linear Systems and Signals","note":"Section 002 - Choose TUT with same Associated Class number as primary meet. Section 001 is auto-enrolled.","class_number":4733,"section":"TUT 103","campus":"UW U","associated_class":2,"related_component_1":null,"related_component_2":null,"enrollment_capacity":64,"enrollment_total":52,"waiting_capacity":0,"waiting_total":0,"topic":null,"reserves":[],"classes":[{"date":{"start_time":"14:30","end_time":"15:20","weekdays":"Th","start_date":null,"end_date":null,"is_tba":false,"is_cancelled":false,"is_closed":false},"location":{"building":"E5","room":"3101"},"instructors":[]}],"held_with":[],"term":1149,"academic_level":"undergraduate","last_updated":"2014-09-07T10:09:32-04:00"}]}];
      }

      console.log("Downloaded course schedules. Processing the stuff...");
      self.state(app.state.PROCESSING);
      self.trace("Downloaded schedules.");

      console.log('courses', courses);

      courses.forEach(function(course) {

        // Skip invalid course
        if (!course.data.length) return;

        // For a single course
        var course_code = course.data[0].subject + course.data[0].catalog_number;
        schedules[course_code] = {};
        course_schedule = {};

        course_data[course_code] = {
          title: course.data[0].title,
        };

        course.data.forEach(function(section) {
          // For a single section
          var section_code = section.section;
          schedules[course_code][section_code] = app.model.populateSchedule(section.classes);

          // Add info on related sections
          Object.defineProperty(schedules[course_code][section_code], "related", {
            enumerable: false,
            writable: true,
            value: []
          });
          if (section.related_component_1) {
            schedules[course_code][section_code].related.push(section.related_component_1);
          }
          if (section.related_component_2) {
            schedules[course_code][section_code].related.push(section.related_component_2);
          }
        });
        
        // Find the combinations of sections that do not conflict for this course
        Object.defineProperty(schedules[course_code], "section_combinations", {
          enumerable: false,
          writable: true,
          value: new Uint32Array(10),
        });
        app.model.buildSectionCombinations(schedules[course_code]);
      });
      
      console.log("Got them schedules", schedules);
      self.schedules(schedules);
      self.course_data(course_data);
      self.viewer.schedules(schedules);

      // Get only valid course codes in preferred list
      preferred = Object.keys(schedules);
      self.preferred(preferred);
      self.preferred_input(preferred.join(' '));

      // Panic if there are less valid course codes than number requested
      if (preferred.length < count) {
        alert("Nope: Some of the course codes were wrong. \r\nMaybe you choose wrong term?");
        self.state(app.state.READY);
        m.redraw();
        return;
      }

      var t0 = performance.now();
      
      // Find the pairs of courses that conflict
      var conflicting_pairs = Combinatorics.combination(preferred, 2).filter(function (pair) {
        var all_section_selections = Combinatorics.cartesianProduct(schedules[pair[0]].section_combinations, schedules[pair[1]].section_combinations).toArray();

        var schedulesConflict = function(section_selection) {
          // Input is like [["LEC 001", "TUT 101"], ["LEC 001", "TUT 102", "LAB 201"]]

          var canvas_schedule = new Uint32Array(10);

          section_selection[0].forEach(function (section_code) {
            app.model.schedule.or(canvas_schedule, schedules[pair[0]][section_code]);
          });

          var hasConflict = section_selection[1].some(function (section_code) {
            var section_schedule = schedules[pair[1]][section_code];
            if (app.model.schedule.hasConflict(canvas_schedule, section_schedule)) {
              return true;
            }
            app.model.schedule.or(canvas_schedule, section_schedule);
          });

          return hasConflict;
        };

        return all_section_selections.every(schedulesConflict);
      });
      conflicting_pairs.sort();
      // conflicting_pairs.push(["ECE484","ME269"],["ECE484","MTE420"]);
      console.log("Course pairs whose schedules conflict", conflicting_pairs);
      
      // Find all possible course selections, then remove those that contain conflicting pairs
      var selections = Combinatorics.combination(preferred, count).toArray();
      conflicting_pairs.forEach(function (pair) {
        
        // Determine whether pair exists in each selection
        selections = selections.filter(function (selection) {
          for (var i = 0, l = selection.length; i < l; ++i) {
            if (selection[i] == pair[0]) {
              for (var j = i; j < l; ++j) { // Assumes selection is sorted
                if (selection[j] == pair[1]) {
                  return false;
                }
              }
            }
          }
          return true;
        });
        
      });

      console.log("Valid selections", selections);

      var section_selections = {};
      selections.forEach(function (selection) {
        // Find a valid section selection inside this course selection
        var section_selection = app.model.findSectionSelection(selection, schedules);
        if (section_selection) {
          section_selections[selection.join(" ")] = section_selection.join("/");
        }
      });
      
      // section_selections[selection][combination (the selection but with different sections)][course_index][section_index] = full_section_label
      console.log("Valid selections with a section selection", section_selections);

      // Display final selections
      selections.forEach(function (selection) {
        self.trace(selection.join("\t"));
      });
      self.trace("Found " + selections.length + " valid course selections (conservative estimate; could be much less).");
      self.conflicting_pairs(conflicting_pairs);
      self.section_selections(section_selections);
      
      // Show the schedule in the viewer
      var default_selection = Object.keys(section_selections)[0];
      self.viewer.section_selection(section_selections[default_selection]);
      self.active_selection(default_selection);
      self.introscreen(false);
      self.state(app.state.READY);

      console.log("Duration of ctrl.go (ms)", performance.now() - t0);

      m.redraw();
    });

    // Done
    return;
  };

  this.selection_click = function (section_selection, active_selection) {
    console.log("Showing selection", section_selection);
    this.active_selection(active_selection);
    this.viewer.section_selection(section_selection);
    return false;
  };

  this.section_click = function (course_code, section_code) {
    console.log("Section click", course_code, section_code);

    console.log("active selection", this.active_selection());
    console.log("section selections", this.section_selections());
    
    // TODO Reeeeeally clean this shit up (string manipulation is so dirty)
    var section_type = section_code.split(" ")[0];
    var full_section_codes = this.viewer.section_selection().split("/");

    full_section_codes.some(function (full_section_code, index) {
      // Return true only if we're at the full section code we want to change
      // Return false otherwise

      // Not the right course?
      if (full_section_code.indexOf(course_code) == -1) {
        return false;
      }

      // Not the right section type?
      if (full_section_code.indexOf(section_type) == -1) {
        return false;
      }

      // OK got it, now change it to what the user wanted
      full_section_codes[index] = course_code + ":" + section_code;
      return true;
    });
    
    // Save the new section selection, and show it in the viewer
    var new_section_selection = full_section_codes.join("/");
    this.viewer.section_selection(new_section_selection);

    // Change it in the controller's section selections too
    this.section_selections()[this.active_selection()] = new_section_selection;

    return false;
  };
};

app.model = {};

app.model.schedule = {};

// Compute a bitwise OR operation (a := a | b), with results in array a
app.model.schedule.or = function (a, b) {
  for (var i = 0, l = a.length; i < l; ++i) {
    a[i] |= b[i];
  }
};

// Compute a bitwise AND operation (a := a & b), with results in array a
app.model.schedule.and = function (a, b) {
  for (var i = 0, l = a.length; i < l; ++i) {
    a[i] &= b[i];
  }
};

// Compute a bitwise NOT on all elements of a
// a is modified
app.model.schedule.not = function (a) {
  for (var i = 0, l = a.length; i < l; ++i) {
    a[i] = ~a[i];
  }
}

// Returns true if there is a conflict between a and b, otherwise return false
// (a and b are not affected)
app.model.schedule.hasConflict = function (a, b) {
  for (var i = 0, l = a.length; i < l; ++i) {
    if (a[i] & b[i]) {
      return true;
    }
  }
  return false;
}

// We're given an array of course codes, and the schedules array.
// Find a valid selection of sections for these courses, or return null
// A combination is just a set of stuff; a selection is semantically different, it is a set of stuff that the user could finally select
app.model.findSectionSelection = function (course_codes, schedules) {

  var section_combinations_by_course = course_codes.map(function (course_code) {
    var section_combinations = schedules[course_code].section_combinations; // Looks like [['LEC 001', 'TUT 101'], ['LEC 001', 'TUT 102']]
    return section_combinations.map(function (section_combination) {
      return section_combination.map(function (section_code) {
        return course_code + ":" + section_code;
      });
    });
  });

  var section_selection, section_selections = Combinatorics.cartesianProduct.apply(null, section_combinations_by_course);
  while (section_selection = section_selections.next()) {

    // Flatten section selections into a flat array of full section names
    section_selection = Array.prototype.concat.apply([], section_selection);


    // Check for schedule conflicts
    var canvas_schedule = new Uint32Array(10);
    var schedulesConflict = function (full_section_code) {
      var course_code = full_section_code.split(":")[0];
      var section_code = full_section_code.split(":")[1];
      if (app.model.schedule.hasConflict(canvas_schedule, schedules[course_code][section_code])) {
        return true;
      }
      app.model.schedule.or(canvas_schedule, schedules[course_code][section_code]);
    };

    // If this section selection has conflicts, move on
    if (section_selection.some(schedulesConflict)) {
      continue;
    }

    // Check for related section requirements
    var section_numbers = section_selection.map(function (full_section_code) {
      // Get an array of only {course code + section number}
      return full_section_code.split(":")[0] + ":" + full_section_code.split(" ")[1];
    });
    var relatedRequirementsUnfulfilled = function (full_section_code) {
      var course_code = full_section_code.split(":")[0];
      var section_code = full_section_code.split(":")[1];
      var related = schedules[course_code][section_code].related;
      if (related.length == 0) return false;

      // The following .some returns true if requirement is unfulfilled
      return related.some(function (related_section_number) {
        if (related_section_number == 99) return false;
        return section_numbers.indexOf(course_code + ":" + related_section_number) == -1;
      });
    }

    // If this section selection requires related sections not included in the selection, move on
    if (section_selection.some(relatedRequirementsUnfulfilled)) {
      continue;
    }

    // If we get here, then we've got in our hands a valid section selection
    break;
  }

  return section_selection || null;
};

// Make a hash to categorise each section code by its type
// Example: {"LEC": ["LEC 001"], "TUT": ["TUT 101", "TUT 102"]}
app.model.splitSectionCodesByType = function(section_codes) {
  var section_codes_by_type = {};
  section_codes.forEach(function (section_code) {
    var type = section_code.split(" ")[0];

    if (!section_codes_by_type[type]) section_codes_by_type[type] = [];
    section_codes_by_type[type].push(section_code);
  });
  return section_codes_by_type;
};

// Within all the combinations of the different sections offered, pick those that are valid
app.model.buildSectionCombinations = function(course) {
  // What we get is "course", a hash of schedules (with extra property "related")
  var section_codes_by_type_hash = app.model.splitSectionCodesByType(Object.keys(course));

  // Transform associative array into numeric array
  var section_codes_by_type = [];
  Object.keys(section_codes_by_type_hash).forEach(function (type){
    section_codes_by_type.push(section_codes_by_type_hash[type]);
  });
  
  var section_combinations = Combinatorics.cartesianProduct.apply(null, section_codes_by_type).filter(function(combination) {
    // Now what we get is an array of section codes (e.g. ["LEC 001", "TUT 103", "LAB 202"] )

    // Array with {course code + " " + section number}
    var section_numbers = combination.map(function (section_code) {
      return section_code.split(" ")[1];
    });

    // Look for related section numbers that are not in this combination
    var relatedRequirementsUnfulfilled = function (section_code) {
      var related = course[section_code].related;
      if (related.length == 0) return false;

      // The following .some returns true if requirement is unfulfilled
      return related.some(function (related_section_number) {
        if (related_section_number == 99) return false;
        return section_numbers.indexOf(related_section_number) == -1;
      });
    }

    // If an unfulfilled requirement exists, .some returns true, so the expression returns false, and the combination is removed.
    if (combination.some(relatedRequirementsUnfulfilled)) {
      return false;
    }

    // Now check for schedule conflicts
    var canvas_schedule = new Uint32Array(10);
    var schedulesConflict = function (section_code) {
      if (app.model.schedule.hasConflict(canvas_schedule, course[section_code])) {
        return true;
      }
      app.model.schedule.or(canvas_schedule, course[section_code]);
    };

    if (combination.some(schedulesConflict)) {
      return false;
    }

    // This combination survived everything we threw at it, so it passes
    return true;
  });

  course.section_combinations = section_combinations;
};

// Take in a "classes" array, spew out a schedule-array
app.model.populateSchedule = function(classes) {

  var schedule = new Uint32Array(10);
  schedule.tba = false;
  
  classes.forEach(function(data) {
    var date = data.date;
    
    // Ignore invalid times
    if (!date.start_time || !date.end_time) {
      if (date.is_tba) {
        schedule.tba = true;
      }
      return;
    }

    // Process start+end time
    var start = date.start_time.split(":").map(Number);
    var end = date.end_time.split(":").map(Number);
    var start_hour = Math.floor((start[0] - 8) * 2 + (start[1] - 30) / 30); // Time minus 8:30, in 30-minute increments
    var end_hour = Math.floor((end[0] - 8) * 2 + (end[1] - 20) / 30); // Time minus 8:20, in 30-minute increments

    // Find out whether this is even week only, odd week only, or both
    var odd, even;
    if (date.start_date) {
      var parts = date.start_date.split("/").map(Number);
      odd = Boolean((new Date(2014, parts[0] - 1, parts[1])).getWeek() % 2);
      even = !odd;
    }
    else {
      odd = even = true;
    }

    // Get the days where this class is active (0-4 for even weeks, 5-9 for odd weeks)
    var days = [];
    if (even) {
      days = days.concat(date.weekdays
        .replace('Th', '3')
        .replace('M', '0')
        .replace('T', '1')
        .replace('W', '2')
        .replace('F', '4')
        .split('').map(Number));
    }
    if (odd) {
      days = days.concat(date.weekdays
        .replace('Th', '8')
        .replace('M', '5')
        .replace('T', '6')
        .replace('W', '7')
        .replace('F', '9')
        .split('').map(Number));
    }

    // Write occupied blocks to the schedule
    days.forEach(function(day) {
      for (var hour = start_hour; hour < end_hour; ++hour) {
        schedule[day] |= 1 << hour;
      }
    });
  });
  
  return schedule;
};

app.view = function(ctrl) {

  // Labels for the button (changes according to application state)
  var buttonValues = {};
  buttonValues[app.state.READY]       = "Find many timetable";
  buttonValues[app.state.DOWNLOADING] = "Wait, I download numbers...";
  buttonValues[app.state.PROCESSING]  = "Wait, I calculate...";
  
  var schedules = ctrl.schedules();
  var section_selections = ctrl.section_selections();
  var active_selection = ctrl.active_selection();

  // For the active selection, the available section numbers categorised by section type by course
  var section_numbers_by_type_by_course = {};
  active_selection && schedules && active_selection.split(" ").forEach(function (course_code) {
    if (!course_code) return;

    var section_numbers_by_type = {};
    var section_codes_by_type = app.model.splitSectionCodesByType(Object.keys(schedules[course_code]));

    Object.keys(section_codes_by_type).forEach(function (section_type) {
      section_numbers_by_type[section_type] = section_codes_by_type[section_type].map(function (section_code) {
        return section_code.split(" ")[1];
      });
    });
    section_numbers_by_type_by_course[course_code] = section_numbers_by_type;
  });

  return m("html", [
    m("head", [
      (!OFFLINE
      ? m("link", {
          href: "http://fonts.googleapis.com/css?family=Sunshiney|Arimo&subset=latin,latin-ext",
          rel: "stylesheet"
        })
      : ""
      ),
      m("link", {
        rel: "stylesheet",
        href: "app.css"
      }),
      m("title", "LooPlanner"),
    ]),
    m("body", {class: ctrl.introscreen() ? "introscreen" : ""}, [
      m("div#header", [
        m("div#logo", "LooPlanner"),
        m("div#search", [
          m("p.subtitle", [
            "Tell me ",
            m("a", {href: "http://www.adm.uwaterloo.ca/infocour/CIR/SA/under.html", target: "_blank"}, "every course you interest"),
            ", my friend, I find many working timetable for you! ",
            ((ctrl.state() == app.state.READY) ?
                m("a", {href: "javascript:void(0);", onclick: ctrl.go_example.bind(ctrl)}, "(Try example)")
              : "It's coming!"
            ),
          ]),
          m("form", {onsubmit: function (e) {e.preventDefault(); ctrl.go.call(ctrl, ctrl.preferred_input, ctrl.count);}}, [
            m("input.box#preferred", {
              title: "Courses you're interested in taking (each course separated by a space)",
              placeholder: "Courses (format: ece484 mte241 ...)",
              onkeyup: m.withAttr("value", ctrl.preferred_input),
              value: ctrl.preferred_input()
            }),
            m("input.box#count", {
              type: "number", min: 2, max: 6,
              title: "How many courses you take this term",
              placeholder: "How many",
              onkeyup: function (e) {
                ctrl.count(Number(e.target.value) ? Number(e.target.value) : '');
              },
              value: ctrl.count()
            }),
            m("select#term", {
              title: "Which academic term you're planning for",
              value: ctrl.term(),
              onchange: function (e) {
                ctrl.term(e.target.value);
              }
            }, [
              m("option", {value: 1149}, "Fall 2014"),
              m("option", {value: 1151}, "Winter 2015"),
            ]),
            m("input.btn", {
              type: "submit",
              value: buttonValues[ctrl.state()],
              disabled: (ctrl.state() == app.state.READY && ctrl.count() > 1 && (ctrl.count() <= ctrl.preferred_input().trim().split(' ').length)) ? "" : "disabled",
            }),
          ]),
        ]),
      ]),
          m("div#main", Object.keys(ctrl.schedules()).length ? [
            m("div#selections", [
              m("strong", "Possible timetables (" + Object.keys(section_selections).length + ")"),
              m("ul.nice-list", [
                (Object.keys(section_selections).length
                  ? Object.keys(section_selections).map(function (selection) {
                      if (active_selection == selection) {
                        return m("li", [
                          m("a", {
                            href: "#",
                            class: "active",
                            onclick: ctrl.selection_click.bind(ctrl, section_selections[selection], selection)
                          }, selection),
                          m("ul.course-list", [
                            Object.keys(section_numbers_by_type_by_course).map(function (course_code) {
                              return m("li", {
                                  class: (ctrl.hover_course() == course_code) ? 'hover': '',
                                  onmouseover: ctrl.hover_course.bind(ctrl, course_code),
                                  onmouseout: ctrl.hover_course.bind(ctrl, ''),
                                }, [
                                m("span", course_code),
                                m("ul.section-list", [
                                  Object.keys(section_numbers_by_type_by_course[course_code]).map(function (section_type) {
                                    return m("li", [
                                      m("span", section_type),
                                      section_numbers_by_type_by_course[course_code][section_type].map(function (section_number) {
                                        var section_code = section_type + " " + section_number;
                                        var active = (section_selections[selection].indexOf(course_code + ":" + section_code) !== -1);
                                        return (active
                                          ? m("a", {class: "active"}, section_number)
                                          : m("a", {
                                              href: "#",
                                              onclick: ctrl.section_click.bind(ctrl, course_code, section_code),
                                            }, section_number)
                                        );
                                      }),
                                    ]);
                                  }),
                                ]),
                              ]);
                            }),
                          ])
                        ]);
                      } else {
                        return m("li", [
                          m("a", {
                            href: "#",
                            class: "",
                            onclick: ctrl.selection_click.bind(ctrl, section_selections[selection], selection)
                          }, selection),
                        ]);
                      }
                    })
                  : m("li.none", "No valid timetable found :(")
                )
              ]),
            ]),
            m("div#courses", [
              m("strong", "Your wishlist (" + ctrl.preferred().length + ")"),
              m("ul.nice-list", [
                (ctrl.preferred().length
                  ? ctrl.preferred().map(function (course_code) {
                      return m("li", {
                          class: (ctrl.hover_course() == course_code) ? "hover" : "",
                          onmouseover: ctrl.hover_course.bind(ctrl, course_code),
                          onmouseout: ctrl.hover_course.bind(ctrl, ''),
                        }, m("a", {
                          class: (active_selection && active_selection.indexOf(course_code) != -1) ? "active" : "",
                        }, [m("span", course_code), " ", ctrl.course_data()[course_code].title]
                        )
                      );
                    })
                  : m("li.none", "(none)")
                )
              ]),
            ]),
            scheduleViewer.view(ctrl.viewer),
            /*m("div#conflicting-pairs", [
              m("strong", "Courses that cannot be taken together"),
              m("ul", [
                (ctrl.conflicting_pairs().length
                  ? ctrl.conflicting_pairs().map(function (pair) {
                      return m("li", pair[0] + "/" + pair[1]);
                    })
                  : m("li.none", "(none)")
                )
              ]),
            ]),*/
          ] : []),
      /*m("pre#debug", [
        m("span", "Stream of consciousness"),
        ctrl.debug(),
      ]),*/
    ]),
  ]);
};

var scheduleViewer = {};

scheduleViewer.controller = function() {
  this.schedules = m.prop();
  this.section_selection = m.prop();
  this.hover_course = m.prop('');
};

scheduleViewer.view = function(ctrl) {
  var schedules = ctrl.schedules();
  var section_selection = ctrl.section_selection();

  if (!schedules) schedules = {};
  if (!section_selection) section_selection = "";

  // Get an associative array [course_code: [section_code1, section_code2], course_code2: [section_code1]]
  var section_selection_by_course = {};
  section_selection.split("/").forEach(function (course_selection) {
    if (!course_selection) return;

    var course_code = course_selection.split(":")[0];
    var section_code = course_selection.split(":")[1];
    if (!section_selection_by_course[course_code]) section_selection_by_course[course_code] = [];
    // course_selection.split(":")[1].split(",").forEach(function (section_code) {
    //   section_selection_by_course[course_code].push(section_code.replace(/([A-Z]+)([0-9]+)/, "$1 $2"));
    // });
    section_selection_by_course[course_code].push(section_code);
  });
  
  // If n < 10, add '0' in front
  var pad0 = function (n) {
    return (n < 10) ? '0' + n : n;
  };
  
  // Convert 0 to "08:30-09:00", etc.
  var periodToString = function(period) {
    period = period/2 + 8.5;
    // return pad0(Math.floor(period)) + ':' + ((period*2 % 2) ? '30' : '00')
    //    + '-' + pad0(Math.floor(period+0.5)) + ':' + ((period*2 % 2) ? '00' : '30');
     return pad0(Math.floor(period)) + ':' + ((period*2 % 2) ? '30' : '00')
      + '-' + pad0(Math.floor(period+1)) + ':' + ((period*2 % 2) ? '20' : '00');
  };
  
  // Convert 0 to Mo, 1 to Tu, etc.
  var dayNames = ['Mo', 'Tu', 'We', 'Th', 'Fr'];
  var dayToString = function(day) {
    return dayNames[day%5];
  };

  // Find out the class name for a label
  var component_abbrs = ["LEC", "TUT", "LAB", "PRJ"];
  var component_names = ["lecture", "tutorial", "laboratory", "project"];
  var countSubstring = function(str, substr) {
    return (str.match(new RegExp(substr, "g")) || []).length;
  };
  var componentClass = function(full_section_label) {
    if (!full_section_label) return "nothing";
    for (var i = component_abbrs.length-1; i >= 0; --i) {
      if (full_section_label.indexOf("or ") != -1) {
        if (countSubstring(full_section_label, "(ev)") == 1 && countSubstring(full_section_label, "(od)") == 1) {
          return "something";
        } else {
          return "conflict";
        }
      }
      if (full_section_label.indexOf(component_abbrs[i]) !== -1) {
        return component_names[i];
      }
    }
    return "something";
  };

  // Return a label for the specified day & period
  var tableCellLabel = function(day, period) {
    var labels = [];

    Object.keys(section_selection_by_course).forEach(function (course_code) {
      var course = schedules[course_code];
      var section_codes = section_selection_by_course[course_code];
      section_codes.forEach(function (section_code) {
        var section = course[section_code];
        var even = section[day] & 1<<period;
        var odd = section[day+5] & 1<<period;
        if (even && odd) {
          labels.push(course_code + ' ' + section_code);
        } else if (even) {
          labels.push(course_code + ' ' + section_code + ' (ev)');
        } else if (odd) {
          labels.push(course_code + ' ' + section_code + ' (od)');
        }
      });
    });
    return labels.join('\r\n or ');
  };

  // Construct a virtual schedule table
  var label_table = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].map(function(period) {
    return [0, 1, 2, 3, 4].map(function(day) {
      return tableCellLabel(day, period);
    });
  });

  // Convert a string into an array containing the text but with \r\n transformed into m("br")
  var nl2br = function(label) {
    var label_array = [];
    label.split('\r\n').forEach(function (line, index) {
      if (index) label_array.push(m("br"));
      label_array.push(line);
    });
    return label_array;
  }

  // Return a {label: "SYDE252 LEC 001", class: "lecture", rowspan: 2} or null if nothing
  var tableCell = function(day, period){
    var label = label_table[period][day];
    var css = componentClass(label);
    var rowspan, height;

    var course_code = ""; // First course code that appears in this cell

    if (label_table[period-1] && label_table[period-1][day] && label_table[period-1][day] == label) {
      // No cell here, there's already a rowspan'd cell above
      return null;
    } else {
      for (var period2 = period+1; period2<=21; ++period2) {
        if (label_table[period2][day] != label) {
          break;
        }
      }

      if (label && css != "conflict") {
        var sections = label.split("or ");
        sections = sections.map(function (section) {
          var parts = section.split(" ");
          var oddeven = (
            section.split("(")[1]
            ? (" (" + section.split("(")[1])
            : ""
          );
          course_code = course_code || parts[0];
          return parts[0] + " " + parts[1] + oddeven;  // Get only the course code + section type + odd/even (if applicable)
        });
        label = sections.join("or ");
      }

      rowspan = label ? period2 - period : 1; // No rowspan for empty cells
      height = rowspan * 20;
      if (rowspan > 1) {
        css += " tall";
      }

      // Handle "fake hovering" cells
      if (ctrl.hover_course() && label.indexOf(ctrl.hover_course()) != -1) {
        css += " hover";
      }

      var mouseover = function () {};
      var mouseout  = function () {};
      if (course_code) {
        mouseover = ctrl.hover_course.bind(ctrl, course_code);
        mouseout  = ctrl.hover_course.bind(ctrl, "");
      }

      return {label: nl2br(label), class: css, rowspan: rowspan, height: height, mouseover: mouseover, mouseout: mouseout};
    }
  };
  
  return m("div.schedule-viewer", [
    m("table",[
      m("tr", [
        m("th.header", {colspan: 6}, Object.keys(section_selection_by_course).join(" ")),
      ]),
      m("tr", [
        m("th"),
        [0, 1, 2, 3, 4].map(function (day) {
          return m("th", dayToString(day));
        }),
      ]),
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].map(function (period) {
        return m("tr", [
          (period%2-1) ? m("th.period", {rowspan: 2}, periodToString(period)) : "",    // 08:30-09:30, etc.
          [0, 1, 2, 3, 4].map(function (day) {
            var cell = tableCell(day, period);
            return cell ? m("td", {class: cell.class, onmouseover: cell.mouseover, onmouseout: cell.mouseout, style: "height: " + cell.height + "px", rowspan: cell.rowspan}, m("div", m("span", cell.label))) : "";
          }),
        ]);
      }),
    ]),
    m("div.legend", [
      m("p", "(ev): Even weeks. (od): Odd weeks."),
      m("p", [
        m("span.lecture"), "Lecture", m("span.tutorial"), "Tutorial", m("span.laboratory"), "Laboratory", m("br"), 
        m("span.project"), "Project", m("span.conflict"), "Conflict", m("span.something"), "Others",
      ]),
    ]),
  ]);
};

m.module(document, app);
